import { z } from 'zod'

// =============================================================================
// Auth Validators — Better Auth + Organization plugin
// =============================================================================

export const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100),
	email: z.string().email('Please enter a valid email address'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(128),
})

export const createOrganizationSchema = z.object({
	name: z.string().min(1, 'Organization name is required').max(100),
	slug: z
		.string()
		.min(2, 'Slug must be at least 2 characters')
		.max(50)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Slug must be lowercase letters, numbers, and hyphens only',
		),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export const inviteMemberSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	role: z.enum(['admin', 'member'], {
		errorMap: () => ({ message: 'Role must be admin or member' }),
	}),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
