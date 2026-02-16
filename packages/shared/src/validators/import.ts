import { z } from 'zod'
import { createContactSchema } from './contacts'

// =============================================================================
// Contact Import Validators
// =============================================================================

export const DUPLICATE_STRATEGIES = ['skip', 'overwrite', 'create_anyway'] as const
export type DuplicateStrategy = (typeof DUPLICATE_STRATEGIES)[number]

export const bulkCreateContactsSchema = z.object({
	contacts: z
		.array(createContactSchema)
		.min(1, 'At least one contact is required')
		.max(5000, 'Maximum 5000 contacts per import'),
	duplicateStrategy: z.enum(DUPLICATE_STRATEGIES).default('skip'),
})

export const importErrorSchema = z.object({
	row: z.number(),
	field: z.string().optional(),
	message: z.string(),
})

export const importResultSchema = z.object({
	imported: z.number(),
	skipped: z.number(),
	updated: z.number(),
	errors: z.array(importErrorSchema),
})

// =============================================================================
// Column Mapping Types
// =============================================================================

/** CRM fields available for column mapping */
export const CRM_CONTACT_FIELDS = [
	'firstName',
	'lastName',
	'email',
	'phone',
	'title',
	'linkedinUrl',
	'source',
	'status',
] as const

export type CrmContactField = (typeof CRM_CONTACT_FIELDS)[number]

/** Common aliases for auto-mapping source columns to CRM fields */
export const COLUMN_ALIAS_MAP: Record<string, CrmContactField> = {
	// firstName
	'first name': 'firstName',
	'first_name': 'firstName',
	'firstname': 'firstName',
	'given name': 'firstName',
	'given_name': 'firstName',
	'givenname': 'firstName',
	// lastName
	'last name': 'lastName',
	'last_name': 'lastName',
	'lastname': 'lastName',
	'surname': 'lastName',
	'family name': 'lastName',
	'family_name': 'lastName',
	'familyname': 'lastName',
	// email
	'email': 'email',
	'e-mail': 'email',
	'email address': 'email',
	'email_address': 'email',
	'emailaddress': 'email',
	// phone
	'phone': 'phone',
	'phone number': 'phone',
	'phone_number': 'phone',
	'phonenumber': 'phone',
	'telephone': 'phone',
	'tel': 'phone',
	'mobile': 'phone',
	'cell': 'phone',
	// title
	'title': 'title',
	'job title': 'title',
	'job_title': 'title',
	'jobtitle': 'title',
	'position': 'title',
	'role': 'title',
	// linkedinUrl
	'linkedin': 'linkedinUrl',
	'linkedin url': 'linkedinUrl',
	'linkedin_url': 'linkedinUrl',
	'linkedinurl': 'linkedinUrl',
	'linkedin profile': 'linkedinUrl',
	// source
	'source': 'source',
	'lead source': 'source',
	'lead_source': 'source',
	// status
	'status': 'status',
}

// =============================================================================
// Inferred Types
// =============================================================================

export type BulkCreateContactsInput = z.infer<typeof bulkCreateContactsSchema>
export type ImportError = z.infer<typeof importErrorSchema>
export type ImportResult = z.infer<typeof importResultSchema>
