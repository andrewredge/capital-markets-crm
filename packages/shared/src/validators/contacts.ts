import { z } from 'zod'

// =============================================================================
// Contact Validators
// =============================================================================

export const CONTACT_STATUSES = ['active', 'inactive', 'lead', 'churned'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

/** Classification of the person in a capital markets context */
export const CONTACT_TYPES = [
	'person',
	'employee',
	'founder',
	'director',
	'shareholder',
	'advisor',
	'board_member',
	'key_person',
] as const
export type ContactType = (typeof CONTACT_TYPES)[number]

/** Subtypes per contact type */
export const CONTACT_SUBTYPES = {
	person: ['general', 'intermediary', 'government_official', 'journalist', 'academic'],
	employee: ['c_suite', 'senior_management', 'middle_management', 'professional', 'operations'],
	founder: ['sole_founder', 'co_founder', 'technical_founder'],
	director: ['executive_director', 'non_executive_director', 'independent_director', 'alternate_director'],
	shareholder: [
		'controlling_shareholder',
		'major_shareholder',
		'minority_shareholder',
		'institutional_shareholder',
		'beneficial_owner',
	],
	advisor: ['financial_advisor', 'legal_advisor', 'technical_advisor', 'strategic_advisor', 'independent_expert'],
	board_member: ['chairman', 'vice_chairman', 'committee_chair', 'board_observer'],
	key_person: ['company_secretary', 'trustee', 'nominee', 'authorized_representative'],
} as const satisfies Record<ContactType, readonly string[]>

/** Flat array of all valid contact subtypes */
export const ALL_CONTACT_SUBTYPES = Object.values(CONTACT_SUBTYPES).flat()
export type ContactSubtype = (typeof ALL_CONTACT_SUBTYPES)[number]

/** Human-readable labels for contact subtypes */
export const CONTACT_SUBTYPE_LABELS: Record<string, string> = {
	// person
	general: 'General',
	intermediary: 'Intermediary / Referral',
	government_official: 'Government Official',
	journalist: 'Journalist / Media',
	academic: 'Academic / Researcher',
	// employee
	c_suite: 'C-Suite Executive',
	senior_management: 'Senior Management (VP, MD, Partner)',
	middle_management: 'Middle Management (Director, Head of)',
	professional: 'Professional (Analyst, Associate)',
	operations: 'Operations / Support',
	// founder
	sole_founder: 'Sole Founder',
	co_founder: 'Co-Founder',
	technical_founder: 'Technical Founder',
	// director
	executive_director: 'Executive Director',
	non_executive_director: 'Non-Executive Director',
	independent_director: 'Independent Director',
	alternate_director: 'Alternate Director',
	// shareholder
	controlling_shareholder: 'Controlling Shareholder',
	major_shareholder: 'Major Shareholder (>5%)',
	minority_shareholder: 'Minority Shareholder',
	institutional_shareholder: 'Institutional Shareholder',
	beneficial_owner: 'Beneficial Owner (UBO)',
	// advisor
	financial_advisor: 'Financial Advisor',
	legal_advisor: 'Legal Advisor',
	technical_advisor: 'Technical Advisor',
	strategic_advisor: 'Strategic Advisor',
	independent_expert: 'Independent Expert',
	// board_member
	chairman: 'Chairman',
	vice_chairman: 'Vice Chairman',
	committee_chair: 'Committee Chair',
	board_observer: 'Board Observer',
	// key_person
	company_secretary: 'Company Secretary',
	trustee: 'Trustee',
	nominee: 'Nominee',
	authorized_representative: 'Authorized Representative',
}

export const createContactSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(100),
	lastName: z.string().min(1, 'Last name is required').max(100),
	email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
	phone: z.string().max(50).optional().or(z.literal('')),
	title: z.string().max(200).optional().or(z.literal('')),
	linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
	contactType: z.enum(CONTACT_TYPES).default('person'),
	contactSubtype: z.string().max(50).optional().or(z.literal('')),
	source: z.string().max(100).optional().or(z.literal('')),
	status: z.enum(CONTACT_STATUSES).default('active'),
})

export const updateContactSchema = createContactSchema.partial()

export const contactFilterSchema = z.object({
	search: z.string().optional(),
	status: z.enum(CONTACT_STATUSES).optional(),
	contactType: z.enum(CONTACT_TYPES).optional(),
	sortBy: z.string().optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type ContactFilterInput = z.infer<typeof contactFilterSchema>
