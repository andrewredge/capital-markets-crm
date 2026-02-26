import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, tenantProcedure } from '../trpc.js'
import * as documentsService from '../../services/documents.js'
import {
	requestUploadUrlSchema,
	confirmUploadSchema,
	updateDocumentSchema,
	documentFilterSchema,
} from '@crm/shared'

export const documentsRouter = router({
	getUploadUrl: tenantProcedure
		.input(requestUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			return documentsService.generateUploadUrl(ctx.tenantId, input)
		}),

	confirmUpload: tenantProcedure
		.input(confirmUploadSchema)
		.mutation(async ({ ctx, input }) => {
			return documentsService.confirmUpload(
				ctx.db,
				ctx.tenantId,
				ctx.session!.userId,
				input,
			)
		}),

	list: tenantProcedure.input(documentFilterSchema).query(async ({ ctx, input }) => {
		return documentsService.list(ctx.db, ctx.tenantId, input)
	}),

	getById: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const doc = await documentsService.getById(ctx.db, ctx.tenantId, input.id)
			if (!doc) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' })
			}
			return doc
		}),

	getDownloadUrl: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const doc = await documentsService.getById(ctx.db, ctx.tenantId, input.id)
			if (!doc) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' })
			}
			const url = await documentsService.getDownloadUrl(doc.storageKey)
			return { url, fileName: doc.fileName, mimeType: doc.mimeType }
		}),

	update: tenantProcedure
		.input(z.object({ id: z.string().min(1) }).merge(updateDocumentSchema))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				return await documentsService.update(ctx.db, ctx.tenantId, id, data)
			} catch (e) {
				if (e instanceof Error && e.message === 'Document not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),

	delete: tenantProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await documentsService.remove(ctx.db, ctx.tenantId, input.id)
			} catch (e) {
				if (e instanceof Error && e.message === 'Document not found') {
					throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
				}
				throw e
			}
		}),
})
