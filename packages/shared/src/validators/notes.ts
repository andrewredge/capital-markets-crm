import { z } from 'zod'

// =============================================================================
// Note Validators
// =============================================================================

export const createNoteSchema = z
	.object({
		title: z.string().max(200).optional().or(z.literal('')),
		content: z.string().min(1, 'Note content is required').max(10000),
		isPinned: z.boolean().default(false),
		contactId: z.string().min(1).optional(),
		companyId: z.string().min(1).optional(),
		dealId: z.string().min(1).optional(),
	})
	.refine((data) => data.contactId || data.companyId || data.dealId, {
		message: 'At least one entity (contact, company, or deal) must be specified',
	})

export const updateNoteSchema = z.object({
	title: z.string().max(200).optional().or(z.literal('')),
	content: z.string().min(1, 'Note content is required').max(10000).optional(),
	isPinned: z.boolean().optional(),
	contactId: z.string().min(1).optional(),
	companyId: z.string().min(1).optional(),
	dealId: z.string().min(1).optional(),
})

export const noteFilterSchema = z.object({
	contactId: z.string().min(1).optional(),
	companyId: z.string().min(1).optional(),
	dealId: z.string().min(1).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteFilterInput = z.infer<typeof noteFilterSchema>
