import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import {
	deals,
	dealParticipants,
	dealStageHistory,
	pipelines,
	pipelineStages,
	contacts,
	companies,
} from '@crm/db/schema'
import type {
	CreateDealInput,
	UpdateDealInput,
	DealFilterInput,
	MoveToStageInput,
	CreateDealParticipantInput,
	UpdateDealParticipantInput,
} from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

// =============================================================================
// Deals
// =============================================================================

export async function listDeals(db: DrizzleDB, tenantId: string, filters: DealFilterInput) {
	const { search, pipelineId, currentStageId, dealType, ownerId, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(deals.organizationId, tenantId)]

	if (pipelineId) {
		conditions.push(eq(deals.pipelineId, pipelineId))
	}
	if (currentStageId) {
		conditions.push(eq(deals.currentStageId, currentStageId))
	}
	if (dealType) {
		conditions.push(eq(deals.dealType, dealType))
	}
	if (ownerId) {
		conditions.push(eq(deals.ownerId, ownerId))
	}
	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(ilike(deals.name, pattern), ilike(deals.description, pattern))!,
		)
	}

	const where = and(...conditions)

	const [items, totalResult] = await Promise.all([
		db
			.select({
				id: deals.id,
				organizationId: deals.organizationId,
				pipelineId: deals.pipelineId,
				currentStageId: deals.currentStageId,
				name: deals.name,
				dealType: deals.dealType,
				amount: deals.amount,
				currency: deals.currency,
				expectedCloseDate: deals.expectedCloseDate,
				confidence: deals.confidence,
				description: deals.description,
				ownerId: deals.ownerId,
				createdAt: deals.createdAt,
				updatedAt: deals.updatedAt,
				stageName: pipelineStages.name,
				stageColor: pipelineStages.color,
				pipelineName: pipelines.name,
			})
			.from(deals)
			.leftJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
			.leftJoin(pipelines, eq(deals.pipelineId, pipelines.id))
			.where(where)
			.orderBy(desc(deals.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(deals).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getDealById(db: DrizzleDB, tenantId: string, id: string) {
	const deal = await db
		.select({
			id: deals.id,
			organizationId: deals.organizationId,
			pipelineId: deals.pipelineId,
			currentStageId: deals.currentStageId,
			name: deals.name,
			dealType: deals.dealType,
			amount: deals.amount,
			currency: deals.currency,
			expectedCloseDate: deals.expectedCloseDate,
			confidence: deals.confidence,
			description: deals.description,
			ownerId: deals.ownerId,
			createdAt: deals.createdAt,
			updatedAt: deals.updatedAt,
			pipeline: {
				id: pipelines.id,
				name: pipelines.name,
			},
			currentStage: {
				id: pipelineStages.id,
				name: pipelineStages.name,
				color: pipelineStages.color,
				isTerminal: pipelineStages.isTerminal,
				terminalType: pipelineStages.terminalType,
			},
		})
		.from(deals)
		.leftJoin(pipelines, eq(deals.pipelineId, pipelines.id))
		.leftJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
		.where(and(eq(deals.id, id), eq(deals.organizationId, tenantId)))
		.limit(1)

	if (!deal[0]) return null

	const [participantRows, historyRows] = await Promise.all([
		listParticipants(db, tenantId, id),
		getStageHistory(db, tenantId, id),
	])

	return { ...deal[0], participants: participantRows, stageHistory: historyRows }
}

export async function createDeal(
	db: DrizzleDB,
	tenantId: string,
	ownerId: string,
	input: CreateDealInput,
) {
	const id = nanoid()
	const [created] = await db
		.insert(deals)
		.values({
			id,
			organizationId: tenantId,
			pipelineId: input.pipelineId,
			currentStageId: input.currentStageId,
			name: input.name,
			dealType: input.dealType,
			amount: input.amount != null ? String(input.amount) : null,
			currency: input.currency ?? 'USD',
			expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
			confidence: input.confidence ?? null,
			description: input.description || null,
			ownerId,
		})
		.returning()

	// Create initial stage history entry
	await db.insert(dealStageHistory).values({
		id: nanoid(),
		organizationId: tenantId,
		dealId: id,
		fromStageId: null,
		toStageId: input.currentStageId,
		movedBy: ownerId,
	})

	return created
}

export async function updateDeal(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateDealInput,
) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	if (input.currentStageId !== undefined) values.currentStageId = input.currentStageId
	if (input.name !== undefined) values.name = input.name
	if (input.dealType !== undefined) values.dealType = input.dealType
	if (input.amount !== undefined) values.amount = input.amount != null ? String(input.amount) : null
	if (input.currency !== undefined) values.currency = input.currency
	if (input.expectedCloseDate !== undefined)
		values.expectedCloseDate = input.expectedCloseDate ? new Date(input.expectedCloseDate) : null
	if (input.confidence !== undefined) values.confidence = input.confidence ?? null
	if (input.description !== undefined) values.description = input.description || null

	const [updated] = await db
		.update(deals)
		.set(values)
		.where(and(eq(deals.id, id), eq(deals.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Deal not found')
	}

	return updated
}

export async function deleteDeal(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(deals)
		.where(and(eq(deals.id, id), eq(deals.organizationId, tenantId)))
		.returning({ id: deals.id })

	if (!deleted) {
		throw new Error('Deal not found')
	}

	return { success: true as const }
}

// =============================================================================
// Stage Transitions
// =============================================================================

export async function moveToStage(
	db: DrizzleDB,
	tenantId: string,
	userId: string,
	input: MoveToStageInput,
) {
	// Get current deal
	const deal = await db.query.deals.findFirst({
		where: and(eq(deals.id, input.dealId), eq(deals.organizationId, tenantId)),
	})

	if (!deal) {
		throw new Error('Deal not found')
	}

	// Validate toStageId belongs to the same pipeline
	const stage = await db.query.pipelineStages.findFirst({
		where: and(
			eq(pipelineStages.id, input.toStageId),
			eq(pipelineStages.pipelineId, deal.pipelineId),
		),
	})

	if (!stage) {
		throw new Error('Stage not found in this pipeline')
	}

	// Update deal stage
	const [updated] = await db
		.update(deals)
		.set({ currentStageId: input.toStageId, updatedAt: new Date() })
		.where(eq(deals.id, input.dealId))
		.returning()

	// Record history
	await db.insert(dealStageHistory).values({
		id: nanoid(),
		organizationId: tenantId,
		dealId: input.dealId,
		fromStageId: deal.currentStageId,
		toStageId: input.toStageId,
		movedBy: userId,
	})

	return updated
}

// =============================================================================
// Kanban
// =============================================================================

export async function getDealsForKanban(db: DrizzleDB, tenantId: string, pipelineId: string) {
	const [stages, dealRows] = await Promise.all([
		db
			.select()
			.from(pipelineStages)
			.where(
				and(
					eq(pipelineStages.pipelineId, pipelineId),
					eq(pipelineStages.organizationId, tenantId),
				),
			)
			.orderBy(asc(pipelineStages.position)),
		db
			.select()
			.from(deals)
			.where(
				and(
					eq(deals.pipelineId, pipelineId),
					eq(deals.organizationId, tenantId),
				),
			)
			.orderBy(desc(deals.updatedAt)),
	])

	// Group deals by stage
	const dealsByStage = new Map<string, typeof dealRows>()
	for (const deal of dealRows) {
		const existing = dealsByStage.get(deal.currentStageId) ?? []
		existing.push(deal)
		dealsByStage.set(deal.currentStageId, existing)
	}

	return {
		stages: stages.map((stage) => ({
			...stage,
			deals: dealsByStage.get(stage.id) ?? [],
		})),
	}
}

// =============================================================================
// Participants
// =============================================================================

export async function listParticipants(db: DrizzleDB, tenantId: string, dealId: string) {
	return db
		.select({
			id: dealParticipants.id,
			dealId: dealParticipants.dealId,
			contactId: dealParticipants.contactId,
			companyId: dealParticipants.companyId,
			role: dealParticipants.role,
			isPrimary: dealParticipants.isPrimary,
			createdAt: dealParticipants.createdAt,
			contact: {
				id: contacts.id,
				firstName: contacts.firstName,
				lastName: contacts.lastName,
				email: contacts.email,
			},
			company: {
				id: companies.id,
				name: companies.name,
				entityType: companies.entityType,
			},
		})
		.from(dealParticipants)
		.leftJoin(contacts, eq(dealParticipants.contactId, contacts.id))
		.leftJoin(companies, eq(dealParticipants.companyId, companies.id))
		.where(
			and(
				eq(dealParticipants.dealId, dealId),
				eq(dealParticipants.organizationId, tenantId),
			),
		)
}

export async function createParticipant(
	db: DrizzleDB,
	tenantId: string,
	input: CreateDealParticipantInput,
) {
	const id = nanoid()
	const [created] = await db
		.insert(dealParticipants)
		.values({
			id,
			organizationId: tenantId,
			dealId: input.dealId,
			contactId: input.contactId || null,
			companyId: input.companyId || null,
			role: input.role,
			isPrimary: input.isPrimary ?? false,
		})
		.returning()

	return created
}

export async function updateParticipant(
	db: DrizzleDB,
	tenantId: string,
	id: string,
	input: UpdateDealParticipantInput,
) {
	const values: Record<string, unknown> = {}
	if (input.role !== undefined) values.role = input.role
	if (input.isPrimary !== undefined) values.isPrimary = input.isPrimary

	const [updated] = await db
		.update(dealParticipants)
		.set(values)
		.where(and(eq(dealParticipants.id, id), eq(dealParticipants.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Participant not found')
	}

	return updated
}

export async function deleteParticipant(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(dealParticipants)
		.where(and(eq(dealParticipants.id, id), eq(dealParticipants.organizationId, tenantId)))
		.returning({ id: dealParticipants.id })

	if (!deleted) {
		throw new Error('Participant not found')
	}

	return { success: true as const }
}

// =============================================================================
// Stage History
// =============================================================================

export async function getStageHistory(db: DrizzleDB, tenantId: string, dealId: string) {
	// Use aliases to avoid conflict between from/to stage joins
	return db
		.select({
			id: dealStageHistory.id,
			dealId: dealStageHistory.dealId,
			fromStageId: dealStageHistory.fromStageId,
			toStageId: dealStageHistory.toStageId,
			movedAt: dealStageHistory.movedAt,
			movedBy: dealStageHistory.movedBy,
		})
		.from(dealStageHistory)
		.where(
			and(
				eq(dealStageHistory.dealId, dealId),
				eq(dealStageHistory.organizationId, tenantId),
			),
		)
		.orderBy(desc(dealStageHistory.movedAt))
}
