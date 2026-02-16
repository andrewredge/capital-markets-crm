import { z } from 'zod'

// =============================================================================
// Contact Validators
// =============================================================================

export const CONTACT_STATUSES = ['active', 'inactive', 'lead', 'churned'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const createContactSchema = z.object({
	firstName: z.string().min(1, 'First name is required').max(100),
	lastName: z.string().min(1, 'Last name is required').max(100),
	email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
	phone: z.string().max(50).optional().or(z.literal('')),
	title: z.string().max(200).optional().or(z.literal('')),
	linkedinUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
	source: z.string().max(100).optional().or(z.literal('')),
	status: z.enum(CONTACT_STATUSES).default('active'),
})

export const updateContactSchema = createContactSchema.partial()

export const contactFilterSchema = z.object({
	search: z.string().optional(),
	status: z.enum(CONTACT_STATUSES).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type ContactFilterInput = z.infer<typeof contactFilterSchema>
