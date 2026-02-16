import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as notesService from '../../services/notes.js'
import { createNoteSchema, updateNoteSchema, noteFilterSchema } from '@crm/shared'

export const notesRouter = router({
	list: tenantProcedure.input(noteFilterSchema).query(async ({ ctx, input }) => {
		return notesService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const note = await notesService.getById(ctx.db, ctx.tenantId, input.id)
			if (!note) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
			}
			return note
		}),

	create: tenantProcedure.input(createNoteSchema).mutation(async ({ ctx, input }) => {
		return notesService.create(ctx.db, ctx.tenantId, input)
	}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateNoteSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await notesService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Note not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await notesService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Note not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
