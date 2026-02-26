import { z } from 'zod'

// =============================================================================
// Platform Admin Validators
// =============================================================================

export const PLATFORM_ROLES = ['user', 'super_admin'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const ACCOUNT_STATUSES = ['pending', 'active', 'suspended'] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

/** Send a platform invitation to a new user */
export const sendPlatformInviteSchema = z.object({
	email: z.string().email('Valid email is required'),
	organizationId: z.string().min(1).optional(),
	platformRole: z.enum(PLATFORM_ROLES).default('user'),
})

/** Update a user's account status (activate/suspend) */
export const updateAccountStatusSchema = z.object({
	userId: z.string().min(1, 'User ID is required'),
	accountStatus: z.enum(ACCOUNT_STATUSES),
})

/** Update a user's platform role */
export const updatePlatformRoleSchema = z.object({
	userId: z.string().min(1, 'User ID is required'),
	platformRole: z.enum(PLATFORM_ROLES),
})

/** Filter for listing platform users */
export const platformUserFilterSchema = z.object({
	search: z.string().optional(),
	accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
	platformRole: z.enum(PLATFORM_ROLES).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

/** Filter for listing platform invitations */
export const platformInvitationFilterSchema = z.object({
	status: z.enum(['pending', 'accepted', 'expired']).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

/** Complete registration via invitation token */
export const completeInvitationSchema = z.object({
	token: z.string().min(1, 'Invitation token is required'),
	name: z.string().min(1, 'Name is required').max(100),
	password: z.string().min(8, 'Password must be at least 8 characters'),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type SendPlatformInviteInput = z.infer<typeof sendPlatformInviteSchema>
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>
export type UpdatePlatformRoleInput = z.infer<typeof updatePlatformRoleSchema>
export type PlatformUserFilterInput = z.infer<typeof platformUserFilterSchema>
export type PlatformInvitationFilterInput = z.infer<typeof platformInvitationFilterSchema>
export type CompleteInvitationInput = z.infer<typeof completeInvitationSchema>
