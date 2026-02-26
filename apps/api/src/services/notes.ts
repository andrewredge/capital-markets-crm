import { and, count, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { notes } from '@crm/db/schema'
import type { CreateNoteInput, UpdateNoteInput, NoteFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function list(db: DrizzleDB, tenantId: string, filters: NoteFilterInput) {
	const { contactId, companyId, dealId, projectId, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(notes.organizationId, tenantId)]

	if (contactId) {
		conditions.push(eq(notes.contactId, contactId))
	}
	if (companyId) {
		conditions.push(eq(notes.companyId, companyId))
	}
	if (dealId) {
		conditions.push(eq(notes.dealId, dealId))
	}
	if (projectId) {
		conditions.push(eq(notes.projectId, projectId))
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db
			.select()
			.from(notes)
			.where(where)
			.orderBy(desc(notes.isPinned), desc(notes.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(notes).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const note = await db.query.notes.findFirst({
		where: and(eq(notes.id, id), eq(notes.organizationId, tenantId)),
	})
	return note ?? null
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateNoteInput) {
	const id = nanoid()
	const [created] = await db
		.insert(notes)
		.values({
			id,
			organizationId: tenantId,
			title: input.title || null,
			content: input.content,
			isPinned: input.isPinned,
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
	input: UpdateNoteInput,
) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	if (input.title !== undefined) values.title = input.title || null
	if (input.content !== undefined) values.content = input.content
	if (input.isPinned !== undefined) values.isPinned = input.isPinned
	if (input.contactId !== undefined) values.contactId = input.contactId || null
	if (input.companyId !== undefined) values.companyId = input.companyId || null
	if (input.dealId !== undefined) values.dealId = input.dealId || null
	if (input.projectId !== undefined) values.projectId = input.projectId || null

	const [updated] = await db
		.update(notes)
		.set(values)
		.where(and(eq(notes.id, id), eq(notes.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Note not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(notes)
		.where(and(eq(notes.id, id), eq(notes.organizationId, tenantId)))
		.returning({ id: notes.id })

	if (!deleted) {
		throw new Error('Note not found')
	}

	return { success: true as const }
}
