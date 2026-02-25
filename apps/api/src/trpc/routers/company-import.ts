import { router, tenantProcedure } from '../trpc.js'
import * as companyImportService from '../../services/company-import.js'
import { bulkCreateCompaniesSchema } from '@crm/shared'

export const companyImportRouter = router({
	bulkCreate: tenantProcedure.input(bulkCreateCompaniesSchema).mutation(async ({ ctx, input }) => {
		return companyImportService.bulkCreate(ctx.db, ctx.tenantId, input)
	}),
})
