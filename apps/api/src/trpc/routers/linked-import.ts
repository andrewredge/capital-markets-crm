import { router, tenantProcedure } from '../trpc.js'
import * as linkedImportService from '../../services/linked-import.js'
import { bulkLinkedImportSchema } from '@crm/shared'

export const linkedImportRouter = router({
	bulkImport: tenantProcedure.input(bulkLinkedImportSchema).mutation(async ({ ctx, input }) => {
		return linkedImportService.bulkLinkedImport(ctx.db, ctx.tenantId, input)
	}),
})
