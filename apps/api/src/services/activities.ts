import { and, count, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { activities } from '@crm/db/schema'
import type { CreateActivityInput, UpdateActivityInput, ActivityFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function list(db: DrizzleDB, tenantId: string, filters: ActivityFilterInput) {
	const { contactId, companyId, dealId, projectId, activityType, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(activities.organizationId, tenantId)]

	if (contactId) {
		conditions.push(eq(activities.contactId, contactId))
	}
	if (companyId) {
		conditions.push(eq(activities.companyId, companyId))
	}
	if (dealId) {
		conditions.push(eq(activities.dealId, dealId))
	}
	if (projectId) {
		conditions.push(eq(activities.projectId, projectId))
	}
	if (activityType) {
		conditions.push(eq(activities.activityType, activityType))
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db
			.select()
			.from(activities)
			.where(where)
			.orderBy(desc(activities.occurredAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(activities).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const activity = await db.query.activities.findFirst({
		where: and(eq(activities.id, id), eq(activities.organizationId, tenantId)),
	})
	return activity ?? null
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateActivityInput) {
	const id = nanoid()
	const [created] = await db
		.insert(activities)
		.values({
			id,
			organizationId: tenantId,
			activityType: input.activityType,
			subject: input.subject || null,
			description: input.description || null,
			occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
			duration: input.duration ?? null,
			contactId: input.contactId || null,
			companyId: input.companyId || null,
			dealId: input.dealId || null,
			projectId: input.projectId || null,
		})
		.returning()

	return created
}

export async function update(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateActivityInput,
) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	if (input.activityType !== undefined) values.activityType = input.activityType
	if (input.subject !== undefined) values.subject = input.subject || null
	if (input.description !== undefined) values.description = input.description || null
	if (input.occurredAt !== undefined) values.occurredAt = new Date(input.occurredAt)
	if (input.duration !== undefined) values.duration = input.duration ?? null
	if (input.contactId !== undefined) values.contactId = input.contactId || null
	if (input.companyId !== undefined) values.companyId = input.companyId || null
	if (input.dealId !== undefined) values.dealId = input.dealId || null
	if (input.projectId !== undefined) values.projectId = input.projectId || null

	const [updated] = await db
		.update(activities)
		.set(values)
		.where(and(eq(activities.id, id), eq(activities.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Activity not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(activities)
		.where(and(eq(activities.id, id), eq(activities.organizationId, tenantId)))
		.returning({ id: activities.id })

	if (!deleted) {
		throw new Error('Activity not found')
	}

	return { success: true as const }
}
