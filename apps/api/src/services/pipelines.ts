import { and, asc, count, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { pipelines, pipelineStages } from '@crm/db/schema'
import type {
	CreatePipelineInput,
	UpdatePipelineInput,
	PipelineFilterInput,
	CreateStageInput,
	UpdateStageInput,
	ReorderStagesInput,
} from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

// =============================================================================
// Pipelines
// =============================================================================

export async function listPipelines(db: DrizzleDB, tenantId: string, filters: PipelineFilterInput) {
	const { search, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(pipelines.organizationId, tenantId)]

	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(ilike(pipelines.name, pattern), ilike(pipelines.description, pattern))!,
		)
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db.select().from(pipelines).where(where).orderBy(pipelines.createdAt).limit(limit).offset(offset),
		db.select({ total: count() }).from(pipelines).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getPipelineById(db: DrizzleDB, tenantId: string, id: string) {
	const pipeline = await db.query.pipelines.findFirst({
		where: and(eq(pipelines.id, id), eq(pipelines.organizationId, tenantId)),
	})

	if (!pipeline) return null

	const stages = await db
		.select()
		.from(pipelineStages)
		.where(eq(pipelineStages.pipelineId, id))
		.orderBy(asc(pipelineStages.position))

	return { ...pipeline, stages }
}

export async function createPipeline(db: DrizzleDB, tenantId: string, input: CreatePipelineInput) {
	const id = nanoid()

	if (input.isDefault) {
		await db
			.update(pipelines)
			.set({ isDefault: false, updatedAt: new Date() })
			.where(and(eq(pipelines.organizationId, tenantId), eq(pipelines.isDefault, true)))
	}

	const [created] = await db
		.insert(pipelines)
		.values({
			id,
			organizationId: tenantId,
			name: input.name,
			description: input.description || null,
			isDefault: input.isDefault ?? false,
		})
		.returning()

	return created
}

export async function updatePipeline(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdatePipelineInput,
) {
	if (input.isDefault) {
		await db
			.update(pipelines)
			.set({ isDefault: false, updatedAt: new Date() })
			.where(
				and(
					eq(pipelines.organizationId, tenantId),
					eq(pipelines.isDefault, true),
				),
			)
	}

	const values: Record<string, unknown> = { updatedAt: new Date() }
	if (input.name !== undefined) values.name = input.name
	if (input.description !== undefined) values.description = input.description || null
	if (input.isDefault !== undefined) values.isDefault = input.isDefault

	const [updated] = await db
		.update(pipelines)
		.set(values)
		.where(and(eq(pipelines.id, id), eq(pipelines.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Pipeline not found')
	}

	return updated
}

export async function deletePipeline(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(pipelines)
		.where(and(eq(pipelines.id, id), eq(pipelines.organizationId, tenantId)))
		.returning({ id: pipelines.id })

	if (!deleted) {
		throw new Error('Pipeline not found')
	}

	return { success: true as const }
}

// =============================================================================
// Pipeline Stages
// =============================================================================

export async function listStages(db: DrizzleDB, tenantId: string, pipelineId: string) {
	return db
		.select()
		.from(pipelineStages)
		.where(
			and(
				eq(pipelineStages.pipelineId, pipelineId),
				eq(pipelineStages.organizationId, tenantId),
			),
		)
		.orderBy(asc(pipelineStages.position))
}

export async function getStageById(db: DrizzleDB, tenantId: string, id: string) {
	const stage = await db.query.pipelineStages.findFirst({
		where: and(eq(pipelineStages.id, id), eq(pipelineStages.organizationId, tenantId)),
	})
	return stage ?? null
}

export async function createStage(db: DrizzleDB, tenantId: string, input: CreateStageInput) {
	if (input.isTerminal && !input.terminalType) {
		throw new Error('Terminal type is required for terminal stages')
	}

	const id = nanoid()
	const [created] = await db
		.insert(pipelineStages)
		.values({
			id,
			organizationId: tenantId,
			pipelineId: input.pipelineId,
			name: input.name,
			position: input.position,
			color: input.color ?? '#3B82F6',
			isTerminal: input.isTerminal ?? false,
			terminalType: input.isTerminal ? (input.terminalType ?? null) : null,
		})
		.returning()

	return created
}

export async function updateStage(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateStageInput,
) {
	if (input.isTerminal === true && !input.terminalType) {
		const existing = await getStageById(db, tenantId, id)
		if (existing && !existing.terminalType) {
			throw new Error('Terminal type is required for terminal stages')
		}
	}

	const values: Record<string, unknown> = { updatedAt: new Date() }
	if (input.name !== undefined) values.name = input.name
	if (input.position !== undefined) values.position = input.position
	if (input.color !== undefined) values.color = input.color
	if (input.isTerminal !== undefined) {
		values.isTerminal = input.isTerminal
		if (!input.isTerminal) values.terminalType = null
	}
	if (input.terminalType !== undefined) values.terminalType = input.terminalType

	const [updated] = await db
		.update(pipelineStages)
		.set(values)
		.where(and(eq(pipelineStages.id, id), eq(pipelineStages.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Stage not found')
	}

	return updated
}

export async function deleteStage(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(pipelineStages)
		.where(and(eq(pipelineStages.id, id), eq(pipelineStages.organizationId, tenantId)))
		.returning({ id: pipelineStages.id })

	if (!deleted) {
		throw new Error('Stage not found')
	}

	return { success: true as const }
}

export async function reorderStages(db: DrizzleDB, tenantId: string, input: ReorderStagesInput) {
	for (let i = 0; i < input.stageIds.length; i++) {
		const stageId = input.stageIds[i]!
		await db
			.update(pipelineStages)
			.set({ position: i, updatedAt: new Date() })
			.where(
				and(
					eq(pipelineStages.id, stageId),
					eq(pipelineStages.pipelineId, input.pipelineId),
					eq(pipelineStages.organizationId, tenantId),
				),
			)
	}

	return { success: true as const }
}
