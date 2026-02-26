import { count, eq, desc } from 'drizzle-orm'
import { contacts, companies, deals, activities } from '@crm/db/schema'
import type { DrizzleDB } from '../lib/types.js'

export async function getStats(db: DrizzleDB, tenantId: string) {
	const [contactCount, companyCount, dealCount] = await Promise.all([
		db.select({ total: count() }).from(contacts).where(eq(contacts.organizationId, tenantId)),
		db.select({ total: count() }).from(companies).where(eq(companies.organizationId, tenantId)),
		db.select({ total: count() }).from(deals).where(eq(deals.organizationId, tenantId)),
	])

	return {
		contacts: contactCount[0]?.total ?? 0,
		companies: companyCount[0]?.total ?? 0,
		deals: dealCount[0]?.total ?? 0,
	}
}

export async function getRecentDeals(db: DrizzleDB, tenantId: string, limit = 5) {
	return db
		.select()
		.from(deals)
		.where(eq(deals.organizationId, tenantId))
		.orderBy(desc(deals.createdAt))
		.limit(limit)
}

export async function getRecentActivities(db: DrizzleDB, tenantId: string, limit = 10) {
	return db
		.select()
		.from(activities)
		.where(eq(activities.organizationId, tenantId))
		.orderBy(desc(activities.createdAt))
		.limit(limit)
}
