import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as activitiesService from '../../services/activities.js'
import { createActivitySchema, updateActivitySchema, activityFilterSchema } from '@crm/shared'

export const activitiesRouter = router({
	list: tenantProcedure.input(activityFilterSchema).query(async ({ ctx, input }) => {
		return activitiesService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const activity = await activitiesService.getById(ctx.db, ctx.tenantId, input.id)
			if (!activity) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Activity not found' })
			}
			return activity
		}),

	create: tenantProcedure.input(createActivitySchema).mutation(async ({ ctx, input }) => {
		return activitiesService.create(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateActivitySchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await activitiesService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Activity not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await activitiesService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Activity not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
