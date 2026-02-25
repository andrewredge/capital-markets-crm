import { z } from 'zod'

// =============================================================================
// Staleness Flags & Scoring
// =============================================================================

export const STALENESS_FLAGS = [
	'no_email',
	'no_phone',
	'title_empty',
	'no_company_role',
	'linkedin_missing',
	'not_verified_90d',
	'not_verified_180d',
	'not_verified_365d',
] as const
export type StalenessFlag = (typeof STALENESS_FLAGS)[number]

export const STALENESS_THRESHOLD = 0.4

/** Score contribution per flag */
export const STALENESS_WEIGHTS: Record<StalenessFlag, number> = {
	no_email: 0.15,
	no_phone: 0.05,
	title_empty: 0.15,
	no_company_role: 0.2,
	linkedin_missing: 0.1,
	not_verified_90d: 0.1,
	not_verified_180d: 0.2,
	not_verified_365d: 0.35,
}

// =============================================================================
// Review Status
// =============================================================================

export const REVIEW_STATUSES = ['pending', 'accepted', 'rejected', 'partially_accepted'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const PROPOSAL_SOURCES = ['manual', 'import_conflict'] as const
export type ProposalSource = (typeof PROPOSAL_SOURCES)[number]

// =============================================================================
// Enrichable Fields
// =============================================================================

export const ENRICHABLE_CONTACT_FIELDS = [
	'firstName',
	'lastName',
	'title',
	'phone',
	'email',
	'linkedinUrl',
	'contactType',
	'contactSubtype',
	'source',
	'status',
] as const
export type EnrichableContactField = (typeof ENRICHABLE_CONTACT_FIELDS)[number]

// =============================================================================
// Validators
// =============================================================================

export const proposedChangeSchema = z.object({
	current: z.string().nullable(),
	proposed: z.string().nullable(),
	confidence: z.enum(['high', 'medium', 'low']),
})

export const reviewProposalSchema = z.object({
	proposalId: z.string().min(1),
	action: z.enum(['accept', 'reject', 'partial']),
	acceptedFields: z.array(z.string()).optional(),
}).refine(
	(data) => data.action !== 'partial' || (data.acceptedFields && data.acceptedFields.length > 0),
	{ message: 'acceptedFields must be non-empty when action is partial', path: ['acceptedFields'] },
)

export const stalenessQueueFilterSchema = z.object({
	minScore: z.number().min(0).max(1).optional(),
	search: z.string().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

export const markVerifiedSchema = z.object({
	contactId: z.string().min(1),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type ProposedChange = z.infer<typeof proposedChangeSchema>
export type ProposedChanges = Partial<Record<EnrichableContactField, ProposedChange>>
export type ReviewProposalInput = z.infer<typeof reviewProposalSchema>
export type StalenessQueueFilterInput = z.infer<typeof stalenessQueueFilterSchema>
