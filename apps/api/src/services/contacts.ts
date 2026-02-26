import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts, contactCompanyRoles, companies } from '@crm/db/schema'
import type { CreateContactInput, UpdateContactInput, ContactFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function list(db: DrizzleDB, tenantId: string, filters: ContactFilterInput) {
	const { search, status, sortBy, sortDir, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(contacts.organizationId, tenantId)]

	if (status) {
		conditions.push(eq(contacts.status, status))
	}

	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(
				ilike(contacts.firstName, pattern),
				ilike(contacts.lastName, pattern),
				ilike(contacts.email, pattern),
			)!,
		)
	}

	const where = and(...conditions)

	const orderColumn = getContactSortColumn(sortBy)
	const orderDir = sortDir === 'asc' ? orderColumn : desc(orderColumn)

	const [items, totalResult] = await Promise.all([
		db.select().from(contacts).where(where).orderBy(orderDir).limit(limit).offset(offset),
		db.select({ total: count() }).from(contacts).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

function getContactSortColumn(sortBy?: string) {
	switch (sortBy) {
		case 'firstName':
			return contacts.firstName
		case 'lastName':
			return contacts.lastName
		case 'email':
			return contacts.email
		case 'status':
			return contacts.status
		default:
			return contacts.createdAt
	}
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const contact = await db.query.contacts.findFirst({
		where: and(eq(contacts.id, id), eq(contacts.organizationId, tenantId)),
	})

	if (!contact) return null

	const roles = await db
		.select({
			id: contactCompanyRoles.id,
			role: contactCompanyRoles.role,
			isPrimary: contactCompanyRoles.isPrimary,
			startDate: contactCompanyRoles.startDate,
			endDate: contactCompanyRoles.endDate,
			company: {
				id: companies.id,
				name: companies.name,
				entityType: companies.entityType,
			},
		})
		.from(contactCompanyRoles)
		.innerJoin(companies, eq(contactCompanyRoles.companyId, companies.id))
		.where(eq(contactCompanyRoles.contactId, id))

	return { ...contact, contactCompanyRoles: roles }
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateContactInput) {
	const id = nanoid()
	const [created] = await db
		.insert(contacts)
		.values({
			id,
			organizationId: tenantId,
			...input,
			email: input.email || null,
			phone: input.phone || null,
			title: input.title || null,
			linkedinUrl: input.linkedinUrl || null,
			source: input.source || null,
		})
		.returning()

	return created
}

export async function update(db: DrizzleDB, tenantId: string, id: string, input: UpdateContactInput) {
	const [updated] = await db
		.update(contacts)
		.set({
			...input,
			email: input.email === '' ? null : input.email,
			phone: input.phone === '' ? null : input.phone,
			title: input.title === '' ? null : input.title,
			linkedinUrl: input.linkedinUrl === '' ? null : input.linkedinUrl,
			source: input.source === '' ? null : input.source,
			updatedAt: new Date(),
		})
		.where(and(eq(contacts.id, id), eq(contacts.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Contact not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(contacts)
		.where(and(eq(contacts.id, id), eq(contacts.organizationId, tenantId)))
		.returning({ id: contacts.id })

	if (!deleted) {
		throw new Error('Contact not found')
	}

	return { success: true as const }
}
