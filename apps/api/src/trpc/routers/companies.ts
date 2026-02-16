import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as companiesService from '../../services/companies.js'
import { createCompanySchema, updateCompanySchema, companyFilterSchema } from '@crm/shared'

export const companiesRouter = router({
	list: tenantProcedure.input(companyFilterSchema).query(async ({ ctx, input }) => {
		return companiesService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const company = await companiesService.getById(ctx.db, ctx.tenantId, input.id)
			if (!company) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
			}
			return company
		}),

	create: tenantProcedure.input(createCompanySchema).mutation(async ({ ctx, input }) => {
		return companiesService.create(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateCompanySchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await companiesService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Company not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await companiesService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Company not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
