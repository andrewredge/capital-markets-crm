import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as associationsService from '../../services/associations.js'
import {
	createContactCompanyRoleSchema,
	updateContactCompanyRoleSchema,
	createCompanyRelationshipSchema,
} from '@crm/shared'

export const contactCompanyRolesRouter = router({
	create: tenantProcedure
		.input(createContactCompanyRoleSchema)
		.mutation(async ({ ctx, input }) => {
			return associationsService.createContactCompanyRole(ctx.db, ctx.tenantId, input)
		}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateContactCompanyRoleSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await associationsService.updateContactCompanyRole(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Contact-company role not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await associationsService.removeContactCompanyRole(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Contact-company role not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})

export const companyRelationshipsRouter = router({
	create: tenantProcedure
		.input(createCompanyRelationshipSchema)
		.mutation(async ({ ctx, input }) => {
			return associationsService.createCompanyRelationship(ctx.db, ctx.tenantId, input)
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await associationsService.removeCompanyRelationship(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Company relationship not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
