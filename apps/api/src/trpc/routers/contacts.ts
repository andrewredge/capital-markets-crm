import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as contactsService from '../../services/contacts.js'
import { createContactSchema, updateContactSchema, contactFilterSchema } from '@crm/shared'

export const contactsRouter = router({
	list: tenantProcedure.input(contactFilterSchema).query(async ({ ctx, input }) => {
		return contactsService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const contact = await contactsService.getById(ctx.db, ctx.tenantId, input.id)
			if (!contact) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' })
			}
			return contact
		}),

	create: tenantProcedure.input(createContactSchema).mutation(async ({ ctx, input }) => {
		return contactsService.create(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateContactSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await contactsService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Contact not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await contactsService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Contact not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
