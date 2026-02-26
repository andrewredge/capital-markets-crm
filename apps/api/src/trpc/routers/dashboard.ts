import { router, tenantProcedure } from '../trpc.js'
import * as dashboardService from '../../services/dashboard.js'
import * as usersService from '../../services/users.js'

export const dashboardRouter = router({
	/** Get entity counts for the active organization */
	getStats: tenantProcedure.query(async ({ ctx }) => {
		return dashboardService.getStats(ctx.db, ctx.tenantId)
	}),

	/** Get recent deals for the active organization */
	getRecentDeals: tenantProcedure.query(async ({ ctx }) => {
		const recentDeals = await dashboardService.getRecentDeals(ctx.db, ctx.tenantId)

		// Resolve owner names
		const ownerIds = recentDeals.map((d) => d.ownerId).filter(Boolean) as string[]
		const nameMap = await usersService.resolveUserNames(ctx.db, ownerIds)

		return recentDeals.map((deal) => ({
			...deal,
			ownerName: deal.ownerId ? (nameMap[deal.ownerId] ?? 'Unknown') : null,
		}))
	}),

	/** Get recent activities for the active organization */
	getRecentActivities: tenantProcedure.query(async ({ ctx }) => {
		return dashboardService.getRecentActivities(ctx.db, ctx.tenantId)
	}),
})
