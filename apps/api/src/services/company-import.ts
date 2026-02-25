import { eq, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { companies } from '@crm/db/schema'
import type { BulkCreateCompaniesInput, ImportResult } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'
import { classifyCompany } from './classification.js'

const BATCH_SIZE = 100

type CompanyInsert = typeof companies.$inferInsert

interface ImportCompanyRow {
	name: string
	entityType: string
	entitySubtype?: string | undefined
	listingStatus?: string | undefined
	website?: string | undefined
	industry?: string | undefined
	headquarters?: string | undefined
	tickerSymbol?: string | undefined
	exchange?: string | undefined
}

function toInsertRow(tenantId: string, input: ImportCompanyRow, autoClassify: boolean): CompanyInsert {
	let entityType = input.entityType
	let entitySubtype = input.entitySubtype || null
	let listingStatus = input.listingStatus || 'unknown'

	if (autoClassify && (!entityType || entityType === 'other')) {
		const classification = classifyCompany(input.name, input.industry, input.tickerSymbol)
		entityType = classification.entityType
		entitySubtype = entitySubtype || classification.entitySubtype
		listingStatus = listingStatus === 'unknown' ? classification.listingStatus : listingStatus
	}

	return {
		id: nanoid(),
		organizationId: tenantId,
		name: input.name,
		entityType,
		entitySubtype,
		listingStatus,
		website: input.website || null,
		industry: input.industry || null,
		headquarters: input.headquarters || null,
		tickerSymbol: input.tickerSymbol || null,
		exchange: input.exchange || null,
	}
}

export async function bulkCreate(
	db: DrizzleDB,
	tenantId: string,
	input: BulkCreateCompaniesInput,
): Promise<ImportResult> {
	const { companies: rows, duplicateStrategy, autoClassify } = input

	const result: ImportResult = { imported: 0, skipped: 0, updated: 0, flaggedForReview: 0, errors: [] }

	// Collect all names for duplicate detection (case-insensitive)
	const namesInImport = rows.map((r, i) => ({ name: r.name.toLowerCase().trim(), index: i }))

	// Query existing companies by name
	const existingByName = new Map<string, string>()
	if (duplicateStrategy !== 'create_anyway') {
		const uniqueNames = [...new Set(namesInImport.map((r) => r.name))]
		for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
			const batch = uniqueNames.slice(i, i + BATCH_SIZE)
			const existing = await db
				.select({ id: companies.id, name: companies.name })
				.from(companies)
				.where(inArray(sql`lower(${companies.name})`, batch))
			for (const row of existing) {
				existingByName.set(row.name.toLowerCase(), row.id)
			}
		}
	}

	// Separate rows into inserts, updates, and skips
	const toInsert: { data: CompanyInsert; rowIndex: number }[] = []
	const toUpdate: { id: string; data: ImportCompanyRow; rowIndex: number }[] = []

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!
		const name = row.name.toLowerCase().trim()
		const existingId = existingByName.get(name)

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
			await db.insert(companies).values(batch.map((b) => b.data))
			result.imported += batch.length
		} catch {
			for (const entry of batch) {
				try {
					await db.insert(companies).values(entry.data)
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
			await db
				.update(companies)
				.set({
					name: data.name,
					entityType: data.entityType,
					entitySubtype: data.entitySubtype || null,
					listingStatus: data.listingStatus || 'unknown',
					website: data.website || null,
					industry: data.industry || null,
					headquarters: data.headquarters || null,
					tickerSymbol: data.tickerSymbol || null,
					exchange: data.exchange || null,
					updatedAt: new Date(),
				})
				.where(eq(companies.id, id))
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
