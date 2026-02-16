import { router, tenantProcedure } from '../trpc.js'
import * as contactImportService from '../../services/contact-import.js'
import { bulkCreateContactsSchema } from '@crm/shared'

export const contactImportRouter = router({
	bulkCreate: tenantProcedure.input(bulkCreateContactsSchema).mutation(async ({ ctx, input }) => {
		return contactImportService.bulkCreate(ctx.db, ctx.tenantId, input)
	}),
})
