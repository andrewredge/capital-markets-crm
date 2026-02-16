import { z } from 'zod'

// =============================================================================
// Tag Validators
// =============================================================================

export const TAG_COLORS = [
	'#3B82F6',
	'#EF4444',
	'#10B981',
	'#F59E0B',
	'#8B5CF6',
	'#EC4899',
	'#6B7280',
] as const

export const createTagSchema = z.object({
	name: z.string().min(1, 'Tag name is required').max(50),
	color: z.string().max(10).optional(),
})

export const updateTagSchema = createTagSchema.partial()

export const createTaggingSchema = z
	.object({
		tagId: z.string().min(1),
		contactId: z.string().min(1).optional(),
		companyId: z.string().min(1).optional(),
		dealId: z.string().min(1).optional(),
	})
	.refine((data) => data.contactId || data.companyId || data.dealId, {
		message: 'At least one entity (contact, company, or deal) must be specified',
	})

export const tagFilterSchema = z.object({
	search: z.string().optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(50),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type CreateTaggingInput = z.infer<typeof createTaggingSchema>
export type TagFilterInput = z.infer<typeof tagFilterSchema>
