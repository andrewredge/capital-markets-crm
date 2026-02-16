import { and, count, eq, ilike } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { tags, taggings } from '@crm/db/schema'
import type { CreateTagInput, UpdateTagInput, CreateTaggingInput, TagFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function list(db: DrizzleDB, tenantId: string, filters: TagFilterInput) {
	const { search, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(tags.organizationId, tenantId)]

	if (search) {
		conditions.push(ilike(tags.name, `%${search}%`))
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db.select().from(tags).where(where).orderBy(tags.name).limit(limit).offset(offset),
		db.select({ total: count() }).from(tags).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateTagInput) {
	// Check uniqueness
	const existing = await db.query.tags.findFirst({
		where: and(eq(tags.organizationId, tenantId), eq(tags.name, input.name)),
	})
	if (existing) {
		throw new Error('A tag with this name already exists')
	}

	const id = nanoid()
	const [created] = await db
		.insert(tags)
		.values({
			id,
			organizationId: tenantId,
			name: input.name,
			color: input.color || null,
		})
		.returning()

	return created
}

export async function update(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateTagInput,
) {
	const values: Record<string, unknown> = {}

	if (input.name !== undefined) {
		// Check uniqueness if name is changing
		const existing = await db.query.tags.findFirst({
			where: and(eq(tags.organizationId, tenantId), eq(tags.name, input.name)),
		})
		if (existing && existing.id !== id) {
			throw new Error('A tag with this name already exists')
		}
		values.name = input.name
	}
	if (input.color !== undefined) values.color = input.color || null

	const [updated] = await db
		.update(tags)
		.set(values)
		.where(and(eq(tags.id, id), eq(tags.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Tag not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(tags)
		.where(and(eq(tags.id, id), eq(tags.organizationId, tenantId)))
		.returning({ id: tags.id })

	if (!deleted) {
		throw new Error('Tag not found')
	}

	return { success: true as const }
}

export async function addTagging(db: DrizzleDB, tenantId: string, input: CreateTaggingInput) {
	const id = nanoid()
	const [created] = await db
		.insert(taggings)
		.values({
			id,
			organizationId: tenantId,
			tagId: input.tagId,
			contactId: input.contactId || null,
			companyId: input.companyId || null,
			dealId: input.dealId || null,
		})
		.returning()

	return created
}

export async function removeTagging(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(taggings)
		.where(and(eq(taggings.id, id), eq(taggings.organizationId, tenantId)))
		.returning({ id: taggings.id })

	if (!deleted) {
		throw new Error('Tagging not found')
	}

	return { success: true as const }
}

export async function getForEntity(
	db: DrizzleDB,
	tenantId: string,
	entity: { contactId?: string; companyId?: string; dealId?: string },
) {
	const conditions = [eq(taggings.organizationId, tenantId)]

	if (entity.contactId) {
		conditions.push(eq(taggings.contactId, entity.contactId))
	}
	if (entity.companyId) {
		conditions.push(eq(taggings.companyId, entity.companyId))
	}
	if (entity.dealId) {
		conditions.push(eq(taggings.dealId, entity.dealId))
	}

	const results = await db
		.select({
			taggingId: taggings.id,
			tagId: tags.id,
			name: tags.name,
			color: tags.color,
		})
		.from(taggings)
		.innerJoin(tags, eq(taggings.tagId, tags.id))
		.where(and(...conditions))
		.orderBy(tags.name)

	return results
}
