import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts, companies, contactCompanyRoles, contactStaleness } from '@crm/db/schema'
import type { BulkLinkedImportInput, LinkedImportResult } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'
import { classifyContact, classifyCompany } from './classification.js'
import { bulkUpsertStaleness } from './staleness.js'

const BATCH_SIZE = 100

type ContactInsert = typeof contacts.$inferInsert
type CompanyInsert = typeof companies.$inferInsert

/**
 * Import contacts with automatic company creation and role linking.
 *
 * For each row:
 * 1. If companyName is provided, find or create the company
 * 2. Create the contact (with auto-classification if enabled)
 * 3. Create a contact_company_role linking them
 *
 * Duplicate detection: contacts by email, companies by name (case-insensitive).
 */
export async function bulkLinkedImport(
	db: DrizzleDB,
	tenantId: string,
	input: BulkLinkedImportInput,
): Promise<LinkedImportResult> {
	const { rows, duplicateStrategy, autoClassify } = input

	const result: LinkedImportResult = {
		imported: 0,
		skipped: 0,
		updated: 0,
		flaggedForReview: 0,
		errors: [],
		companiesCreated: 0,
		rolesCreated: 0,
	}

	const affectedContactIds = new Set<string>()

	// Build company cache: name (lowercase) → id
	// Pre-populate from DB for all company names in the import
	const companyCache = new Map<string, string>()
	const companyNames = [
		...new Set(
			rows
				.map((r) => r.companyName?.trim().toLowerCase())
				.filter((n): n is string => !!n && n !== ''),
		),
	]

	if (companyNames.length > 0) {
		for (let i = 0; i < companyNames.length; i += BATCH_SIZE) {
			const batch = companyNames.slice(i, i + BATCH_SIZE)
			const existing = await db
				.select({ id: companies.id, name: companies.name })
				.from(companies)
				.where(inArray(sql`lower(${companies.name})`, batch))
			for (const row of existing) {
				companyCache.set(row.name.toLowerCase(), row.id)
			}
		}
	}

	// Build existing contacts by email cache
	const existingContactByEmail = new Map<string, string>()
	if (duplicateStrategy !== 'create_anyway') {
		const emails = [
			...new Set(
				rows
					.map((r) => r.email?.toLowerCase().trim())
					.filter((e): e is string => !!e && e !== ''),
			),
		]
		for (let i = 0; i < emails.length; i += BATCH_SIZE) {
			const batch = emails.slice(i, i + BATCH_SIZE)
			const existing = await db
				.select({ id: contacts.id, email: contacts.email })
				.from(contacts)
				.where(inArray(contacts.email, batch))
			for (const row of existing) {
				if (row.email) {
					existingContactByEmail.set(row.email.toLowerCase(), row.id)
				}
			}
		}
	}

	// Process each row
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!
		const rowNum = i + 1

		try {
			// --- Step 1: Find or create company ---
			let companyId: string | undefined
			const companyName = row.companyName?.trim()

			if (companyName) {
				const cachedId = companyCache.get(companyName.toLowerCase())
				if (cachedId) {
					companyId = cachedId
				} else {
					// Create company
					const classification = autoClassify
						? classifyCompany(companyName)
						: { entityType: 'private_company' as const, entitySubtype: 'sme', listingStatus: 'unknown' as const }

					const newCompany: CompanyInsert = {
						id: nanoid(),
						organizationId: tenantId,
						name: companyName,
						entityType: classification.entityType,
						entitySubtype: classification.entitySubtype,
						listingStatus: classification.listingStatus,
					}

					await db.insert(companies).values(newCompany)
					companyCache.set(companyName.toLowerCase(), newCompany.id)
					companyId = newCompany.id
					result.companiesCreated++
				}
			}

			// --- Step 2: Create or skip/update contact ---
			const email = row.email?.toLowerCase().trim()
			const existingContactId = email ? existingContactByEmail.get(email) : undefined

			if (existingContactId) {
				affectedContactIds.add(existingContactId)
				if (duplicateStrategy === 'skip') {
					result.skipped++
					// Still create role if company exists and contact was skipped
					if (companyId) {
						await createRoleIfNotExists(db, tenantId, existingContactId, companyId, row.companyRole, result)
					}
					continue
				}
				if (duplicateStrategy === 'overwrite') {
					const updateData = buildContactUpdate(row, autoClassify)
					await db
						.update(contacts)
						.set({ ...updateData, updatedAt: new Date() })
						.where(eq(contacts.id, existingContactId))
					result.updated++

					if (companyId) {
						await createRoleIfNotExists(db, tenantId, existingContactId, companyId, row.companyRole, result)
					}
					continue
				}
			}

			// Insert new contact
			const contactInsert = buildContactInsert(tenantId, row, autoClassify)
			await db.insert(contacts).values(contactInsert)
			result.imported++
			affectedContactIds.add(contactInsert.id)

			if (email) {
				existingContactByEmail.set(email, contactInsert.id)
			}

			// --- Step 3: Create role linking contact → company ---
			if (companyId) {
				await createRoleIfNotExists(db, tenantId, contactInsert.id, companyId, row.companyRole, result)
			}
		} catch (err) {
			result.errors.push({
				row: rowNum,
				message: err instanceof Error ? err.message : 'Import failed',
			})
		}
	}

	// Recompute staleness for all affected contacts
	const affectedIds = Array.from(affectedContactIds)
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

function buildContactInsert(tenantId: string, row: BulkLinkedImportInput['rows'][number], autoClassify: boolean): ContactInsert {
	let contactType = row.contactType || 'person'
	let contactSubtype = row.contactSubtype || null

	if (autoClassify && (!row.contactType || row.contactType === 'person') && !row.contactSubtype) {
		const classification = classifyContact(row.title)
		contactType = classification.contactType
		contactSubtype = classification.contactSubtype
	}

	return {
		id: nanoid(),
		organizationId: tenantId,
		firstName: row.firstName,
		lastName: row.lastName,
		email: row.email || null,
		phone: row.phone || null,
		title: row.title || null,
		linkedinUrl: row.linkedinUrl || null,
		contactType,
		contactSubtype,
		source: row.source || null,
		status: row.status || 'active',
	}
}

function buildContactUpdate(row: BulkLinkedImportInput['rows'][number], autoClassify: boolean) {
	let contactType = row.contactType || undefined
	let contactSubtype = row.contactSubtype || undefined

	if (autoClassify && (!row.contactType || row.contactType === 'person') && !row.contactSubtype) {
		const classification = classifyContact(row.title)
		contactType = classification.contactType
		contactSubtype = classification.contactSubtype
	}

	return {
		firstName: row.firstName,
		lastName: row.lastName,
		email: row.email || null,
		phone: row.phone || null,
		title: row.title || null,
		linkedinUrl: row.linkedinUrl || null,
		contactType,
		contactSubtype,
		source: row.source || null,
		status: row.status || 'active',
	}
}

async function createRoleIfNotExists(
	db: DrizzleDB,
	tenantId: string,
	contactId: string,
	companyId: string,
	roleLabel: string | undefined,
	result: LinkedImportResult,
) {
	// Check if this specific contact→company link already exists
	const existing = await db
		.select({ id: contactCompanyRoles.id })
		.from(contactCompanyRoles)
		.where(
			and(
				eq(contactCompanyRoles.contactId, contactId),
				eq(contactCompanyRoles.companyId, companyId),
			),
		)
		.limit(1)

	if (existing.length > 0) return

	const role = normalizeRole(roleLabel)
	try {
		await db.insert(contactCompanyRoles).values({
			id: nanoid(),
			organizationId: tenantId,
			contactId,
			companyId,
			role,
			isPrimary: true,
		})
		result.rolesCreated++
	} catch {
		// Duplicate — ignore silently
	}
}

const ROLE_MAP: Record<string, string> = {
	'ceo': 'ceo',
	'chief executive': 'ceo',
	'cfo': 'cfo',
	'chief financial': 'cfo',
	'cto': 'cto',
	'chief technology': 'cto',
	'founder': 'founder',
	'co-founder': 'founder',
	'partner': 'partner',
	'managing director': 'managing_director',
	'md': 'managing_director',
	'vice president': 'vice_president',
	'vp': 'vice_president',
	'director': 'director',
	'analyst': 'analyst',
	'associate': 'associate',
	'board member': 'board_member',
	'board': 'board_member',
	'advisor': 'advisor',
	'adviser': 'advisor',
	'investor': 'investor',
}

function normalizeRole(label: string | undefined): string {
	if (!label || !label.trim()) return 'other'
	const lower = label.toLowerCase().trim()
	return ROLE_MAP[lower] || 'other'
}
