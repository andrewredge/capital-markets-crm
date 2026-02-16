import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as tagsService from '../../services/tags.js'
import { createTagSchema, updateTagSchema, createTaggingSchema, tagFilterSchema } from '@crm/shared'

export const tagsRouter = router({
	list: tenantProcedure.input(tagFilterSchema).query(async ({ ctx, input }) => {
		return tagsService.list(ctx.db, ctx.tenantId, input)
	}),

	create: tenantProcedure.input(createTagSchema).mutation(async ({ ctx, input }) => {
		try {
			return await tagsService.create(ctx.db, ctx.tenantId, input)
		} catch (e) {
			if (e instanceof Error && e.message === 'A tag with this name already exists') {
				throw new TRPCError({ code: 'CONFLICT', message: e.message })
			}
			throw e
		}
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateTagSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await tagsService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Tag not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				if (e instanceof Error && e.message === 'A tag with this name already exists') {
					throw new TRPCError({ code: 'CONFLICT', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await tagsService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Tag not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	addTagging: tenantProcedure.input(createTaggingSchema).mutation(async ({ ctx, input }) => {
		return tagsService.addTagging(ctx.db, ctx.tenantId, input)
	}),

	removeTagging: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await tagsService.removeTagging(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Tagging not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	getForEntity: tenantProcedure
		.input(
			z
				.object({
					contactId: z.string().min(1).optional(),
					companyId: z.string().min(1).optional(),
					dealId: z.string().min(1).optional(),
				})
				.refine((data) => data.contactId || data.companyId || data.dealId, {
					message: 'At least one entity must be specified',
				}),
		)
		.query(async ({ ctx, input }) => {
			return tagsService.getForEntity(ctx.db, ctx.tenantId, input)
		}),
})
