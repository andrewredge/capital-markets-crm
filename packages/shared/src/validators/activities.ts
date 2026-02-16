import { z } from 'zod'

// =============================================================================
// Activity Validators
// =============================================================================

export const ACTIVITY_TYPES = ['meeting', 'call', 'email', 'note', 'task', 'deal_update'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const createActivitySchema = z
	.object({
		activityType: z.enum(ACTIVITY_TYPES),
		subject: z.string().max(200).optional().or(z.literal('')),
		description: z.string().max(5000).optional().or(z.literal('')),
		occurredAt: z.string().datetime().optional(),
		duration: z.number().int().min(0).optional().nullable(),
		contactId: z.string().min(1).optional(),
		companyId: z.string().min(1).optional(),
		dealId: z.string().min(1).optional(),
	})
	.refine((data) => data.contactId || data.companyId || data.dealId, {
		message: 'At least one entity (contact, company, or deal) must be specified',
	})

export const updateActivitySchema = z.object({
	activityType: z.enum(ACTIVITY_TYPES).optional(),
	subject: z.string().max(200).optional().or(z.literal('')),
	description: z.string().max(5000).optional().or(z.literal('')),
	occurredAt: z.string().datetime().optional(),
	duration: z.number().int().min(0).optional().nullable(),
	contactId: z.string().min(1).optional(),
	companyId: z.string().min(1).optional(),
	dealId: z.string().min(1).optional(),
})

export const activityFilterSchema = z.object({
	contactId: z.string().min(1).optional(),
	companyId: z.string().min(1).optional(),
	dealId: z.string().min(1).optional(),
	activityType: z.enum(ACTIVITY_TYPES).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type ActivityFilterInput = z.infer<typeof activityFilterSchema>
