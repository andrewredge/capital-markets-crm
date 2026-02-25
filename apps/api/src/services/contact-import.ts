import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts, contactStaleness } from '@crm/db/schema'
import type { BulkCreateContactsInput, CreateContactInput, ImportResult } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'
import { classifyContact } from './classification.js'
import { bulkUpsertStaleness } from './staleness.js'

const BATCH_SIZE = 100

type ContactInsert = typeof contacts.$inferInsert

function toInsertRow(tenantId: string, input: CreateContactInput, autoClassify: boolean): ContactInsert {
	let contactType = input.contactType || 'person'
	let contactSubtype = input.contactSubtype || null

	if (autoClassify && (!input.contactType || input.contactType === 'person') && !input.contactSubtype) {
		const classification = classifyContact(input.title)
		contactType = classification.contactType
		contactSubtype = classification.contactSubtype
	}

	return {
		id: nanoid(),
		organizationId: tenantId,
		firstName: input.firstName,
		lastName: input.lastName,
		email: input.email || null,
		phone: input.phone || null,
		title: input.title || null,
		linkedinUrl: input.linkedinUrl || null,
		contactType,
		contactSubtype,
		source: input.source || null,
		status: input.status || 'active',
	}
}

export async function bulkCreate(
	db: DrizzleDB,
	tenantId: string,
	input: BulkCreateContactsInput,
): Promise<ImportResult> {
	const { contacts: rows, duplicateStrategy, autoClassify } = input

	const result: ImportResult = { imported: 0, skipped: 0, updated: 0, flaggedForReview: 0, errors: [] }

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
	const toInsert: { data: ContactInsert; rowIndex: number }[] = []
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

		toInsert.push({ data: toInsertRow(tenantId, row, autoClassify), rowIndex: i + 1 })
	}

	// Batch inserts
	for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
		const batch = toInsert.slice(i, i + BATCH_SIZE)
		try {
			await db.insert(contacts).values(batch.map((b) => b.data))
			result.imported += batch.length
		} catch {
			// On batch failure, try individual inserts to identify bad rows
			for (const entry of batch) {
				try {
					await db.insert(contacts).values(entry.data)
					result.imported++
				} catch (err) {
					result.errors.push({
						row: entry.rowIndex,
						message: err instanceof Error ? err.message : 'Insert failed',
					})
				}
			}
		}
	}

	// Process updates
	for (const { id, data, rowIndex } of toUpdate) {
		try {
			let contactType = data.contactType || undefined
			let contactSubtype = data.contactSubtype || undefined

			if (autoClassify && (!data.contactType || data.contactType === 'person') && !data.contactSubtype) {
				const classification = classifyContact(data.title)
				contactType = classification.contactType
				contactSubtype = classification.contactSubtype
			}

			await db
				.update(contacts)
				.set({
					firstName: data.firstName,
					lastName: data.lastName,
					email: data.email || null,
					phone: data.phone || null,
					title: data.title || null,
					linkedinUrl: data.linkedinUrl || null,
					contactType,
					contactSubtype,
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

	// Recompute staleness for all affected contacts
	const affectedIds = [...toInsert.map((c) => c.data.id as string), ...toUpdate.map((u) => u.id)]
	if (affectedIds.length > 0) {
		await bulkUpsertStaleness(db, tenantId, affectedIds)

		// Count how many are flagged for review (score >= 0.4)
		const flagged = await db
			.select({ count: sql<number>`count(*)` })
			.from(contactStaleness)
			.where(
				and(
					inArray(contactStaleness.contactId, affectedIds),
					gte(contactStaleness.stalenessScore, 0.4),
				),
			)
		result.flaggedForReview = Number(flagged[0]?.count ?? 0)
	}

	return result
}
