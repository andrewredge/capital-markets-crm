import { z } from 'zod'

// =============================================================================
// Contact–Company Role Validators
// =============================================================================

export const CONTACT_COMPANY_ROLES = [
	'founder',
	'ceo',
	'cto',
	'cfo',
	'partner',
	'managing_director',
	'vice_president',
	'director',
	'analyst',
	'associate',
	'board_member',
	'advisor',
	'investor',
	'other',
] as const
export type ContactCompanyRole = (typeof CONTACT_COMPANY_ROLES)[number]

export const createContactCompanyRoleSchema = z.object({
	contactId: z.string().min(1, 'Contact is required'),
	companyId: z.string().min(1, 'Company is required'),
	role: z.enum(CONTACT_COMPANY_ROLES, {
		errorMap: () => ({ message: 'Role is required' }),
	}),
	isPrimary: z.boolean().default(false),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
})

export const updateContactCompanyRoleSchema = z.object({
	role: z.enum(CONTACT_COMPANY_ROLES).optional(),
	isPrimary: z.boolean().optional(),
	startDate: z.string().datetime().optional().nullable(),
	endDate: z.string().datetime().optional().nullable(),
})

// =============================================================================
// Company Relationship Validators
// =============================================================================

export const COMPANY_RELATIONSHIP_TYPES = [
	// Capital markets
	'investor_in',
	'portfolio_company_of',
	'subsidiary_of',
	'parent_of',
	'partner_with',
	'client_of',
	'vendor_to',
	'acquirer_of',
	'acquired_by',
	'competitor_of',
	// Mining & resources
	'jv_partner_with',
	'offtake_buyer_of',
	'offtake_seller_to',
	'operator_of',
] as const
export type CompanyRelationshipType = (typeof COMPANY_RELATIONSHIP_TYPES)[number]

export const createCompanyRelationshipSchema = z.object({
	fromCompanyId: z.string().min(1, 'Source company is required'),
	toCompanyId: z.string().min(1, 'Target company is required'),
	relationshipType: z.enum(COMPANY_RELATIONSHIP_TYPES, {
		errorMap: () => ({ message: 'Relationship type is required' }),
	}),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateContactCompanyRoleInput = z.infer<typeof createContactCompanyRoleSchema>
export type UpdateContactCompanyRoleInput = z.infer<typeof updateContactCompanyRoleSchema>
export type CreateCompanyRelationshipInput = z.infer<typeof createCompanyRelationshipSchema>
