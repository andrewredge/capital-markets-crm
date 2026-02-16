import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as pipelinesService from '../../services/pipelines.js'
import {
	createPipelineSchema,
	updatePipelineSchema,
	pipelineFilterSchema,
	createStageSchema,
	updateStageSchema,
	reorderStagesSchema,
} from '@crm/shared'

export const pipelinesRouter = router({
	list: tenantProcedure.input(pipelineFilterSchema).query(async ({ ctx, input }) => {
		return pipelinesService.listPipelines(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const pipeline = await pipelinesService.getPipelineById(ctx.db, ctx.tenantId, input.id)
			if (!pipeline) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Pipeline not found' })
			}
			return pipeline
		}),

	create: tenantProcedure.input(createPipelineSchema).mutation(async ({ ctx, input }) => {
		return pipelinesService.createPipeline(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updatePipelineSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await pipelinesService.updatePipeline(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Pipeline not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await pipelinesService.deletePipeline(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Pipeline not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				if (e instanceof Error && e.message.includes('violates foreign key constraint')) {
					throw new TRPCError({
						code: 'PRECONDITION_FAILED',
						message: 'Cannot delete pipeline with existing deals',
					})
				}
				throw e
			}
		}),

	// Stage procedures
	listStages: tenantProcedure
		.input(z.object({ pipelineId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			return pipelinesService.listStages(ctx.db, ctx.tenantId, input.pipelineId)
		}),

	getStageById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const stage = await pipelinesService.getStageById(ctx.db, ctx.tenantId, input.id)
			if (!stage) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Stage not found' })
			}
			return stage
		}),

	createStage: tenantProcedure.input(createStageSchema).mutation(async ({ ctx, input }) => {
		try {
			return await pipelinesService.createStage(ctx.db, ctx.tenantId, input)
		} catch (e) {
			if (e instanceof Error && e.message === 'Terminal type is required for terminal stages') {
				throw new TRPCError({ code: 'BAD_REQUEST', message: e.message })
			}
			throw e
		}
	}),

	updateStage: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateStageSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await pipelinesService.updateStage(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Stage not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				if (e instanceof Error && e.message === 'Terminal type is required for terminal stages') {
					throw new TRPCError({ code: 'BAD_REQUEST', message: e.message })
				}
				throw e
			}
		}),

	deleteStage: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await pipelinesService.deleteStage(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Stage not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				if (e instanceof Error && e.message.includes('violates foreign key constraint')) {
					throw new TRPCError({
						code: 'PRECONDITION_FAILED',
						message: 'Cannot delete stage with existing deals',
					})
				}
				throw e
			}
		}),

	reorderStages: tenantProcedure.input(reorderStagesSchema).mutation(async ({ ctx, input }) => {
		return pipelinesService.reorderStages(ctx.db, ctx.tenantId, input)
	}),
})
