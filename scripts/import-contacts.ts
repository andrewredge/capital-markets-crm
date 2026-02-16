/**
 * CLI script to import contacts from a CSV file.
 *
 * Usage:
 *   npx tsx scripts/import-contacts.ts \
 *     --file contacts.csv \
 *     --org-id org_abc123 \
 *     --mapping '{"First Name":"firstName","Last Name":"lastName","Email":"email"}' \
 *     --duplicates skip \
 *     --dry-run
 *
 * Requires DATABASE_URL env var (reads from apps/api/.env by default).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, inArray, sql } from 'drizzle-orm'
import postgres from 'postgres'
import Papa from 'papaparse'
import { nanoid } from 'nanoid'
import * as schema from '@crm/db/schema'
import {
	createContactSchema,
	DUPLICATE_STRATEGIES,
	type CrmContactField,
	type DuplicateStrategy,
	type CreateContactInput,
} from '@crm/shared'

// Load .env from apps/api if DATABASE_URL not set
if (!process.env.DATABASE_URL) {
	const dotenvPath = resolve(import.meta.dirname, '..', 'apps', 'api', '.env')
	try {
		const content = readFileSync(dotenvPath, 'utf-8')
		for (const line of content.split('\n')) {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith('#')) continue
			const eqIdx = trimmed.indexOf('=')
			if (eqIdx === -1) continue
			const key = trimmed.slice(0, eqIdx).trim()
			const value = trimmed.slice(eqIdx + 1).trim()
			if (!process.env[key]) {
				process.env[key] = value
			}
		}
	} catch {
		// .env not found, will fail later if DATABASE_URL is missing
	}
}

const { values } = parseArgs({
	options: {
		file: { type: 'string', short: 'f' },
		'org-id': { type: 'string', short: 'o' },
		mapping: { type: 'string', short: 'm' },
		duplicates: { type: 'string', short: 'd', default: 'skip' },
		'dry-run': { type: 'boolean', default: false },
	},
	strict: true,
})

function fail(msg: string): never {
	console.error(`Error: ${msg}`)
	process.exit(1)
}

if (!values.file) fail('--file is required')
if (!values['org-id']) fail('--org-id is required')
if (!values.mapping) fail('--mapping is required (JSON object)')
if (!process.env.DATABASE_URL) fail('DATABASE_URL not set')

const duplicateStrategy = (values.duplicates || 'skip') as DuplicateStrategy
if (!DUPLICATE_STRATEGIES.includes(duplicateStrategy)) {
	fail(`Invalid --duplicates value. Must be one of: ${DUPLICATE_STRATEGIES.join(', ')}`)
}

let columnMapping: Record<string, CrmContactField>
try {
	columnMapping = JSON.parse(values.mapping)
} catch {
	fail('--mapping must be valid JSON')
}

// Parse CSV
const csvPath = resolve(values.file)
const csvContent = readFileSync(csvPath, 'utf-8')
const parsed = Papa.parse<string[]>(csvContent, { skipEmptyLines: true })
if (parsed.errors.length > 0) {
	fail(`CSV parse errors: ${parsed.errors.map((e) => e.message).join(', ')}`)
}

const data = parsed.data as string[][]
if (data.length < 2) fail('CSV must have a header row and at least one data row')

const headers = data[0]!
const rows = data.slice(1)

// Apply mapping
const validContacts: CreateContactInput[] = []
const validationErrors: { row: number; message: string }[] = []

for (let i = 0; i < rows.length; i++) {
	const row = rows[i]!
	const mapped: Record<string, string> = {}

	for (let j = 0; j < headers.length; j++) {
		const crmField = columnMapping[headers[j]!]
		if (crmField) {
			mapped[crmField] = row[j] || ''
		}
	}

	const result = createContactSchema.safeParse(mapped)
	if (result.success) {
		validContacts.push(result.data)
	} else {
		for (const issue of result.error.issues) {
			validationErrors.push({
				row: i + 2, // +1 for header, +1 for 1-indexed
				message: `${issue.path.join('.')}: ${issue.message}`,
			})
		}
	}
}

console.log(`Parsed ${rows.length} rows from ${values.file}`)
console.log(`  Valid: ${validContacts.length}`)
console.log(`  Validation errors: ${validationErrors.length}`)

if (validationErrors.length > 0) {
	console.log('\nValidation errors:')
	for (const err of validationErrors.slice(0, 20)) {
		console.log(`  Row ${err.row}: ${err.message}`)
	}
	if (validationErrors.length > 20) {
		console.log(`  ... and ${validationErrors.length - 20} more`)
	}
}

if (validContacts.length === 0) fail('No valid contacts to import')

if (values['dry-run']) {
	console.log('\n[DRY RUN] No changes made to the database.')
	process.exit(0)
}

// Import to database
const BATCH_SIZE = 100
const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client, { schema })
const orgId = values['org-id']!
const { contacts } = schema

try {
	const result = await db.transaction(async (tx) => {
		await tx.execute(sql`SET LOCAL app.current_tenant = ${orgId}`)

		const imported = { count: 0, skipped: 0, updated: 0, errors: [] as { row: number; message: string }[] }

		// Find existing emails for dedup
		const existingByEmail = new Map<string, string>()
		if (duplicateStrategy !== 'create_anyway') {
			const emails = validContacts.map((c) => c.email?.toLowerCase().trim()).filter(Boolean) as string[]
			const unique = [...new Set(emails)]
			for (let i = 0; i < unique.length; i += BATCH_SIZE) {
				const batch = unique.slice(i, i + BATCH_SIZE)
				const existing = await tx
					.select({ id: contacts.id, email: contacts.email })
					.from(contacts)
					.where(inArray(contacts.email, batch))
				for (const row of existing) {
					if (row.email) existingByEmail.set(row.email.toLowerCase(), row.id)
				}
			}
		}

		// Classify rows
		const toInsert: (typeof contacts.$inferInsert)[] = []
		const toUpdate: { id: string; data: CreateContactInput }[] = []

		for (const contact of validContacts) {
			const email = contact.email?.toLowerCase().trim()
			const existingId = email ? existingByEmail.get(email) : undefined

			if (existingId && duplicateStrategy === 'skip') {
				imported.skipped++
			} else if (existingId && duplicateStrategy === 'overwrite') {
				toUpdate.push({ id: existingId, data: contact })
			} else {
				toInsert.push({
					id: nanoid(),
					organizationId: orgId,
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email || null,
					phone: contact.phone || null,
					title: contact.title || null,
					linkedinUrl: contact.linkedinUrl || null,
					source: contact.source || null,
					status: contact.status || 'active',
				})
			}
		}

		// Batch insert
		for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
			const batch = toInsert.slice(i, i + BATCH_SIZE)
			await tx.insert(contacts).values(batch)
			imported.count += batch.length
		}

		// Updates
		for (const { id, data } of toUpdate) {
			await tx
				.update(contacts)
				.set({
					firstName: data.firstName,
					lastName: data.lastName,
					email: data.email || null,
					phone: data.phone || null,
					title: data.title || null,
					linkedinUrl: data.linkedinUrl || null,
					source: data.source || null,
					status: data.status || 'active',
					updatedAt: new Date(),
				})
				.where(eq(contacts.id, id))
			imported.updated++
		}

		return imported
	})

	console.log('\nImport complete:')
	console.log(`  Imported: ${result.count}`)
	console.log(`  Skipped: ${result.skipped}`)
	console.log(`  Updated: ${result.updated}`)
} catch (e) {
	fail(e instanceof Error ? e.message : 'Import failed')
} finally {
	await client.end()
}
