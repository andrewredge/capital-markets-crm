import { z } from 'zod'

// =============================================================================
// Deal Validators
// =============================================================================

export const DEAL_TYPE_VALUES = [
	'venture_investment',
	'ma_buyside',
	'ma_sellside',
	'fundraising',
	'ipo',
	'secondary',
	'debt',
	'advisory',
] as const

export const DEAL_PARTICIPANT_ROLE_VALUES = [
	'target',
	'acquirer',
	'investor',
	'lead_investor',
	'co_investor',
	'advisor',
	'legal_counsel',
	'intermediary',
] as const

export const createDealSchema = z.object({
	pipelineId: z.string().min(1, 'Pipeline is required'),
	currentStageId: z.string().min(1, 'Stage is required'),
	name: z.string().min(1, 'Deal name is required').max(200),
	dealType: z.enum(DEAL_TYPE_VALUES),
	amount: z.number().min(0).optional().nullable(),
	currency: z.string().length(3).default('USD'),
	expectedCloseDate: z.string().datetime().optional().nullable(),
	confidence: z.number().int().min(0).max(100).optional().nullable(),
	description: z.string().max(5000).optional().or(z.literal('')),
})

export const updateDealSchema = createDealSchema.partial().omit({ pipelineId: true })

export const dealFilterSchema = z.object({
	search: z.string().optional(),
	pipelineId: z.string().min(1).optional(),
	currentStageId: z.string().min(1).optional(),
	dealType: z.enum(DEAL_TYPE_VALUES).optional(),
	ownerId: z.string().min(1).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

export const moveToStageSchema = z.object({
	dealId: z.string().min(1),
	toStageId: z.string().min(1),
})

// =============================================================================
// Deal Participant Validators
// =============================================================================

export const createDealParticipantSchema = z
	.object({
		dealId: z.string().min(1, 'Deal is required'),
		contactId: z.string().min(1).optional(),
		companyId: z.string().min(1).optional(),
		role: z.enum(DEAL_PARTICIPANT_ROLE_VALUES),
		isPrimary: z.boolean().default(false),
	})
	.refine((data) => data.contactId || data.companyId, {
		message: 'At least one entity (contact or company) must be specified',
	})

export const updateDealParticipantSchema = z.object({
	role: z.enum(DEAL_PARTICIPANT_ROLE_VALUES).optional(),
	isPrimary: z.boolean().optional(),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateDealInput = z.infer<typeof createDealSchema>
export type UpdateDealInput = z.infer<typeof updateDealSchema>
export type DealFilterInput = z.infer<typeof dealFilterSchema>
export type MoveToStageInput = z.infer<typeof moveToStageSchema>
export type CreateDealParticipantInput = z.infer<typeof createDealParticipantSchema>
export type UpdateDealParticipantInput = z.infer<typeof updateDealParticipantSchema>
