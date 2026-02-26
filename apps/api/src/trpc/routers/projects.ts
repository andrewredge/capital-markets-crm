import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as projectsService from '../../services/projects.js'
import {
	createProjectSchema,
	updateProjectSchema,
	projectFilterSchema,
	createProjectDealSchema,
} from '@crm/shared'

export const projectsRouter = router({
	list: tenantProcedure.input(projectFilterSchema).query(async ({ ctx, input }) => {
		return projectsService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const project = await projectsService.getById(ctx.db, ctx.tenantId, input.id)
			if (!project) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' })
			}
			return project
		}),

	create: tenantProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
		return projectsService.create(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateProjectSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await projectsService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Project not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await projectsService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Project not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	// Project-Deal linking
	listDeals: tenantProcedure
		.input(z.object({ projectId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			return projectsService.listProjectDeals(ctx.db, ctx.tenantId, input.projectId)
		}),

	linkDeal: tenantProcedure
		.input(createProjectDealSchema)
		.mutation(async ({ ctx, input }) => {
			return projectsService.linkDeal(ctx.db, ctx.tenantId, input)
		}),

	unlinkDeal: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await projectsService.unlinkDeal(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Project-deal link not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
