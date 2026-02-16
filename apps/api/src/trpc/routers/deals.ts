import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as dealsService from '../../services/deals.js'
import {
	createDealSchema,
	updateDealSchema,
	dealFilterSchema,
	moveToStageSchema,
	createDealParticipantSchema,
	updateDealParticipantSchema,
} from '@crm/shared'

export const dealsRouter = router({
	list: tenantProcedure.input(dealFilterSchema).query(async ({ ctx, input }) => {
		return dealsService.listDeals(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const deal = await dealsService.getDealById(ctx.db, ctx.tenantId, input.id)
			if (!deal) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
			}
			return deal
		}),

	create: tenantProcedure.input(createDealSchema).mutation(async ({ ctx, input }) => {
		return dealsService.createDeal(ctx.db, ctx.tenantId, ctx.user!.id, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateDealSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await dealsService.updateDeal(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Deal not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await dealsService.deleteDeal(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Deal not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	moveToStage: tenantProcedure.input(moveToStageSchema).mutation(async ({ ctx, input }) => {
		try {
			return await dealsService.moveToStage(ctx.db, ctx.tenantId, ctx.user!.id, input)
		} catch (e) {
			if (e instanceof Error && e.message === 'Deal not found') {
				throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
			}
			if (e instanceof Error && e.message === 'Stage not found in this pipeline') {
				throw new TRPCError({ code: 'BAD_REQUEST', message: e.message })
			}
			throw e
		}
	}),

	getForKanban: tenantProcedure
		.input(z.object({ pipelineId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			return dealsService.getDealsForKanban(ctx.db, ctx.tenantId, input.pipelineId)
		}),

	// Participant procedures
	listParticipants: tenantProcedure
		.input(z.object({ dealId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			return dealsService.listParticipants(ctx.db, ctx.tenantId, input.dealId)
		}),

	createParticipant: tenantProcedure
		.input(createDealParticipantSchema)
		.mutation(async ({ ctx, input }) => {
			return dealsService.createParticipant(ctx.db, ctx.tenantId, input)
		}),

	updateParticipant: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateDealParticipantSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await dealsService.updateParticipant(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Participant not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	deleteParticipant: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await dealsService.deleteParticipant(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Participant not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	getStageHistory: tenantProcedure
		.input(z.object({ dealId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			return dealsService.getStageHistory(ctx.db, ctx.tenantId, input.dealId)
		}),
})
