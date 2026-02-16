import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc.js'
import { auth } from '../../lib/auth.js'
import * as organizationsService from '../../services/organizations.js'

export const organizationsRouter = router({
	/**
	 * List all organizations the authenticated user belongs to.
	 * Uses protectedProcedure (no tenant context needed — orgs are not tenant-scoped).
	 */
	list: protectedProcedure.query(async ({ ctx }) => {
		return organizationsService.listByUser(auth, ctx.headers)
	}),

	/**
	 * Get full organization details by ID.
	 */
	getById: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			const org = await organizationsService.getById(auth, ctx.headers, input.organizationId)
			if (!org) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Organization not found',
				})
			}
			return org
		}),

	/**
	 * Set the user's active organization.
	 */
	setActive: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return organizationsService.setActive(auth, ctx.headers, input.organizationId)
		}),
})
