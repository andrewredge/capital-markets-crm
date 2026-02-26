import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, superAdminProcedure, publicProcedure } from '../trpc.js'
import {
	sendPlatformInviteSchema,
	updateAccountStatusSchema,
	updatePlatformRoleSchema,
	platformUserFilterSchema,
	platformInvitationFilterSchema,
	completeInvitationSchema,
} from '@crm/shared'
import * as platformAdminService from '../../services/platform-admin.js'
import { auth } from '../../lib/auth.js'

export const platformAdminRouter = router({
	/** List all platform users (super-admin only) */
	listUsers: superAdminProcedure
		.input(platformUserFilterSchema)
		.query(async ({ ctx, input }) => {
			return platformAdminService.listUsers(ctx.db, input)
		}),

	/** Get a single user by ID (super-admin only) */
	getUser: superAdminProcedure
		.input(z.object({ userId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const user = await platformAdminService.getUserById(ctx.db, input.userId)
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
			}
			return user
		}),

	/** Update a user's account status (super-admin only) */
	updateAccountStatus: superAdminProcedure
		.input(updateAccountStatusSchema)
		.mutation(async ({ ctx, input }) => {
			// Prevent super-admin from suspending themselves
			if (input.userId === ctx.user.id && input.accountStatus !== 'active') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'You cannot suspend your own account',
				})
			}
			try {
				return await platformAdminService.updateAccountStatus(ctx.db, input.userId, input.accountStatus)
			} catch (e) {
				throw new TRPCError({ code: 'NOT_FOUND', message: (e as Error).message })
			}
		}),

	/** Update a user's platform role (super-admin only) */
	updatePlatformRole: superAdminProcedure
		.input(updatePlatformRoleSchema)
		.mutation(async ({ ctx, input }) => {
			// Prevent super-admin from demoting themselves
			if (input.userId === ctx.user.id && input.platformRole !== 'super_admin') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'You cannot remove your own super-admin role',
				})
			}
			try {
				return await platformAdminService.updatePlatformRole(ctx.db, input.userId, input.platformRole)
			} catch (e) {
				throw new TRPCError({ code: 'NOT_FOUND', message: (e as Error).message })
			}
		}),

	/** Send a platform invitation (super-admin only) */
	sendInvitation: superAdminProcedure
		.input(sendPlatformInviteSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await platformAdminService.createInvitation(ctx.db, ctx.user.id, input)
			} catch (e) {
				throw new TRPCError({ code: 'CONFLICT', message: (e as Error).message })
			}
		}),

	/** List platform invitations (super-admin only) */
	listInvitations: superAdminProcedure
		.input(platformInvitationFilterSchema)
		.query(async ({ ctx, input }) => {
			return platformAdminService.listInvitations(ctx.db, input)
		}),

	/** Revoke a pending invitation (super-admin only) */
	revokeInvitation: superAdminProcedure
		.input(z.object({ invitationId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await platformAdminService.revokeInvitation(ctx.db, input.invitationId)
			} catch (e) {
				throw new TRPCError({ code: 'NOT_FOUND', message: (e as Error).message })
			}
		}),

	/** List all organizations (super-admin only) */
	listOrganizations: superAdminProcedure
		.query(async ({ ctx }) => {
			return platformAdminService.listOrganizations(ctx.db)
		}),

	/** Validate an invitation token (public — used on the invite-register page) */
	validateInvitation: publicProcedure
		.input(z.object({ token: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const invitation = await platformAdminService.getInvitationByToken(ctx.db, input.token)
			if (!invitation) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invitation is invalid or has expired',
				})
			}
			return { email: invitation.email, organizationId: invitation.organizationId }
		}),

	/** Complete registration via invitation (public) */
	completeInvitation: publicProcedure
		.input(completeInvitationSchema)
		.mutation(async ({ ctx, input }) => {
			const invitation = await platformAdminService.getInvitationByToken(ctx.db, input.token)
			if (!invitation) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invitation is invalid or has expired',
				})
			}

			// Create the user via Better Auth API
			const result = await auth.api.signUpEmail({
				body: {
					email: invitation.email,
					password: input.password,
					name: input.name,
				},
			})

			if (!result) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create account',
				})
			}

			// Update user with the correct platform role (Better Auth creates with defaults)
			await platformAdminService.updatePlatformRole(ctx.db, result.user.id, invitation.platformRole)
			await platformAdminService.updateAccountStatus(ctx.db, result.user.id, 'active')

			// Mark invitation as accepted
			await platformAdminService.markInvitationAccepted(ctx.db, invitation.id)

			return { success: true, email: invitation.email }
		}),
})
