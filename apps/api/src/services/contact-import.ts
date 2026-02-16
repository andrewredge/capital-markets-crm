import { eq, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts } from '@crm/db/schema'
import type { BulkCreateContactsInput, CreateContactInput, ImportResult } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

const BATCH_SIZE = 100

type ContactInsert = typeof contacts.$inferInsert

function toInsertRow(tenantId: string, input: CreateContactInput): ContactInsert {
	return {
		id: nanoid(),
		organizationId: tenantId,
		firstName: input.firstName,
		lastName: input.lastName,
		email: input.email || null,
		phone: input.phone || null,
		title: input.title || null,
		linkedinUrl: input.linkedinUrl || null,
		source: input.source || null,
		status: input.status || 'active',
	}
}

export async function bulkCreate(
	db: DrizzleDB,
	tenantId: string,
	input: BulkCreateContactsInput,
): Promise<ImportResult> {
	const { contacts: rows, duplicateStrategy } = input

	const result: ImportResult = { imported: 0, skipped: 0, updated: 0, errors: [] }

	// Collect all non-empty emails for duplicate detection
	const emailsInImport = rows
		.map((r, i) => ({ email: r.email?.toLowerCase().trim(), index: i }))
		.filter((r): r is { email: string; index: number } => !!r.email && r.email !== '')

	// Query existing contacts by email
	const existingByEmail = new Map<string, string>()
	if (emailsInImport.length > 0 && duplicateStrategy !== 'create_anyway') {
		const uniqueEmails = [...new Set(emailsInImport.map((r) => r.email))]
		// Query in batches to avoid parameter limits
		for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
			const batch = uniqueEmails.slice(i, i + BATCH_SIZE)
			const existing = await db
				.select({ id: contacts.id, email: contacts.email })
				.from(contacts)
				.where(inArray(contacts.email, batch))
			for (const row of existing) {
				if (row.email) {
					existingByEmail.set(row.email.toLowerCase(), row.id)
				}
			}
		}
	}

	// Separate rows into inserts, updates, and skips
	const toInsert: ContactInsert[] = []
	const toUpdate: { id: string; data: CreateContactInput; rowIndex: number }[] = []

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!
		const email = row.email?.toLowerCase().trim()
		const existingId = email ? existingByEmail.get(email) : undefined

		if (existingId) {
			if (duplicateStrategy === 'skip') {
				result.skipped++
				continue
			}
			if (duplicateStrategy === 'overwrite') {
				toUpdate.push({ id: existingId, data: row, rowIndex: i + 1 })
				continue
			}
		}

		toInsert.push(toInsertRow(tenantId, row))
	}

	// Batch inserts
	for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
		const batch = toInsert.slice(i, i + BATCH_SIZE)
		try {
			await db.insert(contacts).values(batch)
			result.imported += batch.length
		} catch {
			// On batch failure, try individual inserts to identify bad rows
			for (let j = 0; j < batch.length; j++) {
				try {
					await db.insert(contacts).values(batch[j]!)
					result.imported++
				} catch (err) {
					result.errors.push({
						row: i + j + 1,
						message: err instanceof Error ? err.message : 'Insert failed',
					})
				}
			}
		}
	}

	// Process updates
	for (const { id, data, rowIndex } of toUpdate) {
		try {
			await db
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
			result.updated++
		} catch (e) {
			result.errors.push({
				row: rowIndex,
				message: e instanceof Error ? e.message : 'Update failed',
			})
		}
	}

	return result
}
