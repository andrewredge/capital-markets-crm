import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { documents } from '@crm/db/schema'
import type { ConfirmUploadInput, UpdateDocumentInput, DocumentFilterInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'
import {
	getPresignedUploadUrl,
	getPresignedDownloadUrl,
	deleteObject,
} from '../lib/s3.js'

// =============================================================================
// Upload Flow
// =============================================================================

export async function generateUploadUrl(
	tenantId: string,
	input: { fileName: string; mimeType: string; contactId?: string; companyId?: string; dealId?: string; projectId?: string },
) {
	const entityPrefix = input.projectId
		? `projects/${input.projectId}`
		: input.dealId
			? `deals/${input.dealId}`
			: input.companyId
				? `companies/${input.companyId}`
				: `contacts/${input.contactId}`

	const storageKey = `${tenantId}/${entityPrefix}/${nanoid()}-${input.fileName}`
	return getPresignedUploadUrl(storageKey, input.mimeType)
}

export async function confirmUpload(
	db: DrizzleDB,
	tenantId: string,
	userId: string,
	input: ConfirmUploadInput,
) {
	const id = nanoid()
	const [created] = await db
		.insert(documents)
		.values({
			id,
			organizationId: tenantId,
			contactId: input.contactId || null,
			companyId: input.companyId || null,
			dealId: input.dealId || null,
			projectId: input.projectId || null,
			fileName: input.fileName,
			fileSize: input.fileSize,
			mimeType: input.mimeType,
			storageKey: input.storageKey,
			documentType: input.documentType ?? 'other',
			description: input.description || null,
			visibility: input.visibility ?? 'team',
			uploadedBy: userId,
		})
		.returning()

	return created
}

// =============================================================================
// Queries
// =============================================================================

export async function list(db: DrizzleDB, tenantId: string, filters: DocumentFilterInput) {
	const { contactId, companyId, dealId, projectId, documentType, search, sortBy, sortDir, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(documents.organizationId, tenantId)]

	if (contactId) conditions.push(eq(documents.contactId, contactId))
	if (companyId) conditions.push(eq(documents.companyId, companyId))
	if (dealId) conditions.push(eq(documents.dealId, dealId))
	if (projectId) conditions.push(eq(documents.projectId, projectId))
	if (documentType) conditions.push(eq(documents.documentType, documentType))
	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(
				ilike(documents.fileName, pattern),
				ilike(documents.description, pattern),
			)!,
		)
	}

	const where = and(...conditions)

	const orderColumn = getSortColumn(sortBy)
	const orderDir = sortDir === 'asc' ? orderColumn : desc(orderColumn)

	const [items, totalResult] = await Promise.all([
		db
			.select()
			.from(documents)
			.where(where)
			.orderBy(orderDir)
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(documents).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

function getSortColumn(sortBy?: string) {
	switch (sortBy) {
		case 'fileName':
			return documents.fileName
		case 'fileSize':
			return documents.fileSize
		case 'documentType':
			return documents.documentType
		default:
			return documents.createdAt
	}
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const rows = await db
		.select()
		.from(documents)
		.where(and(eq(documents.id, id), eq(documents.organizationId, tenantId)))
		.limit(1)

	return rows[0] ?? null
}

// =============================================================================
// Download
// =============================================================================

export async function getDownloadUrl(storageKey: string) {
	return getPresignedDownloadUrl(storageKey)
}

// =============================================================================
// Mutations
// =============================================================================

export async function update(db: DrizzleDB, tenantId: string, id: string, input: UpdateDocumentInput) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	if (input.documentType !== undefined) values.documentType = input.documentType
	if (input.description !== undefined) values.description = input.description || null
	if (input.visibility !== undefined) values.visibility = input.visibility

	const [updated] = await db
		.update(documents)
		.set(values)
		.where(and(eq(documents.id, id), eq(documents.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Document not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const doc = await getById(db, tenantId, id)
	if (!doc) {
		throw new Error('Document not found')
	}

	// Delete from S3 first, then DB. If S3 fails, DB row stays (user can retry).
	await deleteObject(doc.storageKey)

	await db
		.delete(documents)
		.where(and(eq(documents.id, id), eq(documents.organizationId, tenantId)))

	return { success: true as const }
}
