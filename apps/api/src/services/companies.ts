import { and, count, eq, ilike } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import {
	companies,
	contactCompanyRoles,
	contacts,
	companyRelationships,
} from '@crm/db/schema'
import type { CreateCompanyInput, UpdateCompanyInput, CompanyFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function list(db: DrizzleDB, tenantId: string, filters: CompanyFilterInput) {
	const { search, entityType, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(companies.organizationId, tenantId)]

	if (entityType) {
		conditions.push(eq(companies.entityType, entityType))
	}

	if (search) {
		conditions.push(ilike(companies.name, `%${search}%`))
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db.select().from(companies).where(where).orderBy(companies.createdAt).limit(limit).offset(offset),
		db.select({ total: count() }).from(companies).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const company = await db.query.companies.findFirst({
		where: and(eq(companies.id, id), eq(companies.organizationId, tenantId)),
	})

	if (!company) return null

	const roles = await db
		.select({
			id: contactCompanyRoles.id,
			role: contactCompanyRoles.role,
			isPrimary: contactCompanyRoles.isPrimary,
			startDate: contactCompanyRoles.startDate,
			endDate: contactCompanyRoles.endDate,
			contact: {
				id: contacts.id,
				firstName: contacts.firstName,
				lastName: contacts.lastName,
				email: contacts.email,
			},
		})
		.from(contactCompanyRoles)
		.innerJoin(contacts, eq(contactCompanyRoles.contactId, contacts.id))
		.where(eq(contactCompanyRoles.companyId, id))

	const relationshipsFrom = await db
		.select({
			id: companyRelationships.id,
			relationshipType: companyRelationships.relationshipType,
			toCompany: {
				id: companies.id,
				name: companies.name,
				entityType: companies.entityType,
			},
		})
		.from(companyRelationships)
		.innerJoin(companies, eq(companyRelationships.toCompanyId, companies.id))
		.where(eq(companyRelationships.fromCompanyId, id))

	const relationshipsTo = await db
		.select({
			id: companyRelationships.id,
			relationshipType: companyRelationships.relationshipType,
			fromCompany: {
				id: companies.id,
				name: companies.name,
				entityType: companies.entityType,
			},
		})
		.from(companyRelationships)
		.innerJoin(companies, eq(companyRelationships.fromCompanyId, companies.id))
		.where(eq(companyRelationships.toCompanyId, id))

	return {
		...company,
		contactCompanyRoles: roles,
		companyRelationshipsFrom: relationshipsFrom,
		companyRelationshipsTo: relationshipsTo,
	}
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateCompanyInput) {
	const id = nanoid()
	const [created] = await db
		.insert(companies)
		.values({
			id,
			organizationId: tenantId,
			...input,
			website: input.website || null,
			industry: input.industry || null,
			headquarters: input.headquarters || null,
			foundedYear: input.foundedYear ?? null,
			employeeCountRange: input.employeeCountRange || null,
			investorType: input.investorType || null,
			aum: input.aum || null,
			investmentStageFocus: input.investmentStageFocus ?? null,
			tickerSymbol: input.tickerSymbol || null,
			exchange: input.exchange || null,
			marketCap: input.marketCap || null,
			fundingStage: input.fundingStage || null,
			totalFunding: input.totalFunding || null,
		})
		.returning()

	return created
}

export async function update(db: DrizzleDB, tenantId: string, id: string, input: UpdateCompanyInput) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined) continue
		if (value === '') {
			values[key] = null
		} else {
			values[key] = value
		}
	}

	const [updated] = await db
		.update(companies)
		.set(values)
		.where(and(eq(companies.id, id), eq(companies.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Company not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(companies)
		.where(and(eq(companies.id, id), eq(companies.organizationId, tenantId)))
		.returning({ id: companies.id })

	if (!deleted) {
		throw new Error('Company not found')
	}

	return { success: true as const }
}
