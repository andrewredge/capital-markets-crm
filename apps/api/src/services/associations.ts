import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contactCompanyRoles, companyRelationships } from '@crm/db/schema'
import type {
	CreateContactCompanyRoleInput,
	UpdateContactCompanyRoleInput,
	CreateCompanyRelationshipInput,
} from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

// =============================================================================
// Contact–Company Roles
// =============================================================================

export async function createContactCompanyRole(
	db: DrizzleDB,
	tenantId: string,
	input: CreateContactCompanyRoleInput,
) {
	const id = nanoid()
	const [created] = await db
		.insert(contactCompanyRoles)
		.values({
			id,
			organizationId: tenantId,
			contactId: input.contactId,
			companyId: input.companyId,
			role: input.role,
			isPrimary: input.isPrimary ?? false,
			startDate: input.startDate ? new Date(input.startDate) : null,
			endDate: input.endDate ? new Date(input.endDate) : null,
		})
		.returning()

	return created
}

export async function updateContactCompanyRole(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateContactCompanyRoleInput,
) {
	const values: Record<string, unknown> = {}

	if (input.role !== undefined) values.role = input.role
	if (input.isPrimary !== undefined) values.isPrimary = input.isPrimary
	if (input.startDate !== undefined) values.startDate = input.startDate ? new Date(input.startDate) : null
	if (input.endDate !== undefined) values.endDate = input.endDate ? new Date(input.endDate) : null

	const [updated] = await db
		.update(contactCompanyRoles)
		.set(values)
		.where(and(eq(contactCompanyRoles.id, id), eq(contactCompanyRoles.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Contact-company role not found')
	}

	return updated
}

export async function removeContactCompanyRole(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(contactCompanyRoles)
		.where(and(eq(contactCompanyRoles.id, id), eq(contactCompanyRoles.organizationId, tenantId)))
		.returning({ id: contactCompanyRoles.id })

	if (!deleted) {
		throw new Error('Contact-company role not found')
	}

	return { success: true as const }
}

// =============================================================================
// Company Relationships
// =============================================================================

export async function createCompanyRelationship(
	db: DrizzleDB,
	tenantId: string,
	input: CreateCompanyRelationshipInput,
) {
	const id = nanoid()
	const [created] = await db
		.insert(companyRelationships)
		.values({
			id,
			organizationId: tenantId,
			fromCompanyId: input.fromCompanyId,
			toCompanyId: input.toCompanyId,
			relationshipType: input.relationshipType,
		})
		.returning()

	return created
}

export async function removeCompanyRelationship(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(companyRelationships)
		.where(and(eq(companyRelationships.id, id), eq(companyRelationships.organizationId, tenantId)))
		.returning({ id: companyRelationships.id })

	if (!deleted) {
		throw new Error('Company relationship not found')
	}

	return { success: true as const }
}
