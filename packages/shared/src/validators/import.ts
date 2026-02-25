import { z } from 'zod'
import { createContactSchema } from './contacts'
import { createCompanySchema } from './companies'

// =============================================================================
// Common Import Types
// =============================================================================

export const DUPLICATE_STRATEGIES = ['skip', 'overwrite', 'create_anyway'] as const
export type DuplicateStrategy = (typeof DUPLICATE_STRATEGIES)[number]

export const importErrorSchema = z.object({
	row: z.number(),
	field: z.string().optional(),
	message: z.string(),
})

export const importResultSchema = z.object({
	imported: z.number(),
	skipped: z.number(),
	updated: z.number(),
	flaggedForReview: z.number(),
	errors: z.array(importErrorSchema),
})

// =============================================================================
// Contact Import Validators
// =============================================================================

export const bulkCreateContactsSchema = z.object({
	contacts: z
		.array(createContactSchema)
		.min(1, 'At least one contact is required')
		.max(5000, 'Maximum 5000 contacts per import'),
	duplicateStrategy: z.enum(DUPLICATE_STRATEGIES).default('skip'),
	autoClassify: z.boolean().default(false),
	companyName: z.string().optional(),
	companyRole: z.string().optional(),
})

// =============================================================================
// Company Import Validators
// =============================================================================

/** Subset of company fields for bulk import (omits complex fields) */
export const importCompanySchema = createCompanySchema.pick({
	name: true,
	entityType: true,
	entitySubtype: true,
	listingStatus: true,
	website: true,
	industry: true,
	headquarters: true,
	tickerSymbol: true,
	exchange: true,
})

export const bulkCreateCompaniesSchema = z.object({
	companies: z
		.array(importCompanySchema)
		.min(1, 'At least one company is required')
		.max(5000, 'Maximum 5000 companies per import'),
	duplicateStrategy: z.enum(DUPLICATE_STRATEGIES).default('skip'),
	autoClassify: z.boolean().default(false),
})

// =============================================================================
// Linked Import — contacts with company association
// =============================================================================

export const linkedImportRowSchema = createContactSchema.extend({
	companyName: z.string().optional().or(z.literal('')),
	companyRole: z.string().optional().or(z.literal('')),
})

export const bulkLinkedImportSchema = z.object({
	rows: z
		.array(linkedImportRowSchema)
		.min(1, 'At least one row is required')
		.max(5000, 'Maximum 5000 rows per import'),
	duplicateStrategy: z.enum(DUPLICATE_STRATEGIES).default('skip'),
	autoClassify: z.boolean().default(true),
})

export const linkedImportResultSchema = importResultSchema.extend({
	companiesCreated: z.number(),
	rolesCreated: z.number(),
})

// =============================================================================
// Contact Column Mapping Types
// =============================================================================

/** CRM fields available for contact column mapping */
export const CRM_CONTACT_FIELDS = [
	'firstName',
	'lastName',
	'email',
	'phone',
	'title',
	'linkedinUrl',
	'contactType',
	'contactSubtype',
	'companyName',
	'companyRole',
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
	// companyName
	'company': 'companyName',
	'company name': 'companyName',
	'company_name': 'companyName',
	'companyname': 'companyName',
	'organization': 'companyName',
	'organisation': 'companyName',
	'org': 'companyName',
	'firm': 'companyName',
	'employer': 'companyName',
	// companyRole
	'company role': 'companyRole',
	'company_role': 'companyRole',
	'companyrole': 'companyRole',
	'role at company': 'companyRole',
	'position type': 'companyRole',
	// source
	'source': 'source',
	'lead source': 'source',
	'lead_source': 'source',
	// contactType
	'contact type': 'contactType',
	'contact_type': 'contactType',
	'contacttype': 'contactType',
	'type': 'contactType',
	'classification': 'contactType',
	'person type': 'contactType',
	'category': 'contactType',
	// contactSubtype
	'contact subtype': 'contactSubtype',
	'contact_subtype': 'contactSubtype',
	'contactsubtype': 'contactSubtype',
	'subtype': 'contactSubtype',
	'sub type': 'contactSubtype',
	'sub_type': 'contactSubtype',
	'subcategory': 'contactSubtype',
	'sub category': 'contactSubtype',
	// status
	'status': 'status',
}

// =============================================================================
// Company Column Mapping Types
// =============================================================================

export const CRM_COMPANY_FIELDS = [
	'name',
	'entityType',
	'entitySubtype',
	'listingStatus',
	'website',
	'industry',
	'headquarters',
	'tickerSymbol',
	'exchange',
] as const

export type CrmCompanyField = (typeof CRM_COMPANY_FIELDS)[number]

export const COMPANY_COLUMN_ALIAS_MAP: Record<string, CrmCompanyField> = {
	// name
	'name': 'name',
	'company': 'name',
	'company name': 'name',
	'company_name': 'name',
	'companyname': 'name',
	'organization': 'name',
	'organisation': 'name',
	'firm': 'name',
	// entityType
	'entity type': 'entityType',
	'entity_type': 'entityType',
	'entitytype': 'entityType',
	'type': 'entityType',
	'company type': 'entityType',
	'company_type': 'entityType',
	// entitySubtype
	'entity subtype': 'entitySubtype',
	'entity_subtype': 'entitySubtype',
	'subtype': 'entitySubtype',
	'sub type': 'entitySubtype',
	// listingStatus
	'listing status': 'listingStatus',
	'listing_status': 'listingStatus',
	'listed': 'listingStatus',
	'public private': 'listingStatus',
	// website
	'website': 'website',
	'url': 'website',
	'web': 'website',
	'site': 'website',
	// industry
	'industry': 'industry',
	'sector': 'industry',
	// headquarters
	'headquarters': 'headquarters',
	'hq': 'headquarters',
	'location': 'headquarters',
	'city': 'headquarters',
	'address': 'headquarters',
	// tickerSymbol
	'ticker': 'tickerSymbol',
	'ticker symbol': 'tickerSymbol',
	'ticker_symbol': 'tickerSymbol',
	'symbol': 'tickerSymbol',
	'asx code': 'tickerSymbol',
	'stock code': 'tickerSymbol',
	// exchange
	'exchange': 'exchange',
	'stock exchange': 'exchange',
	'listed on': 'exchange',
}

// =============================================================================
// Inferred Types
// =============================================================================

export type BulkCreateContactsInput = z.infer<typeof bulkCreateContactsSchema>
export type BulkCreateCompaniesInput = z.infer<typeof bulkCreateCompaniesSchema>
export type LinkedImportRow = z.infer<typeof linkedImportRowSchema>
export type BulkLinkedImportInput = z.infer<typeof bulkLinkedImportSchema>
export type LinkedImportResult = z.infer<typeof linkedImportResultSchema>
export type ImportError = z.infer<typeof importErrorSchema>
export type ImportResult = z.infer<typeof importResultSchema>
