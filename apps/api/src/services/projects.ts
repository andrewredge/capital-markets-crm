import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { projects, projectDeals, companies, deals } from '@crm/db/schema'
import type { CreateProjectInput, UpdateProjectInput, ProjectFilterInput, CreateProjectDealInput } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

// =============================================================================
// Projects
// =============================================================================

export async function list(db: DrizzleDB, tenantId: string, filters: ProjectFilterInput) {
	const { search, projectStatus, primaryCommodity, ownerCompanyId, sortBy, sortDir, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = [eq(projects.organizationId, tenantId)]

	if (projectStatus) {
		conditions.push(eq(projects.projectStatus, projectStatus))
	}
	if (primaryCommodity) {
		conditions.push(eq(projects.primaryCommodity, primaryCommodity))
	}
	if (ownerCompanyId) {
		conditions.push(eq(projects.ownerCompanyId, ownerCompanyId))
	}
	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(
				ilike(projects.name, pattern),
				ilike(projects.description, pattern),
				ilike(projects.country, pattern),
			)!,
		)
	}

	const where = and(...conditions)

	const orderColumn = getProjectSortColumn(sortBy)
	const orderDir = sortDir === 'asc' ? orderColumn : desc(orderColumn)

	const [items, totalResult] = await Promise.all([
		db
			.select({
				id: projects.id,
				organizationId: projects.organizationId,
				ownerCompanyId: projects.ownerCompanyId,
				name: projects.name,
				projectStatus: projects.projectStatus,
				country: projects.country,
				primaryCommodity: projects.primaryCommodity,
				stageOfStudy: projects.stageOfStudy,
				createdAt: projects.createdAt,
				updatedAt: projects.updatedAt,
				ownerCompanyName: companies.name,
			})
			.from(projects)
			.leftJoin(companies, eq(projects.ownerCompanyId, companies.id))
			.where(where)
			.orderBy(orderDir)
			.limit(limit)
			.offset(offset),
		db.select({ total: count() }).from(projects).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

function getProjectSortColumn(sortBy?: string) {
	switch (sortBy) {
		case 'name':
			return projects.name
		case 'projectStatus':
			return projects.projectStatus
		case 'primaryCommodity':
			return projects.primaryCommodity
		case 'country':
			return projects.country
		default:
			return projects.createdAt
	}
}

export async function getById(db: DrizzleDB, tenantId: string, id: string) {
	const rows = await db
		.select({
			id: projects.id,
			organizationId: projects.organizationId,
			ownerCompanyId: projects.ownerCompanyId,
			name: projects.name,
			projectStatus: projects.projectStatus,
			country: projects.country,
			stateProvince: projects.stateProvince,
			nearestTown: projects.nearestTown,
			latitude: projects.latitude,
			longitude: projects.longitude,
			primaryCommodity: projects.primaryCommodity,
			secondaryCommodities: projects.secondaryCommodities,
			resourceEstimate: projects.resourceEstimate,
			reserveEstimate: projects.reserveEstimate,
			reportingStandard: projects.reportingStandard,
			tenureType: projects.tenureType,
			tenureExpiry: projects.tenureExpiry,
			tenureArea: projects.tenureArea,
			capexEstimate: projects.capexEstimate,
			npv: projects.npv,
			irr: projects.irr,
			description: projects.description,
			stageOfStudy: projects.stageOfStudy,
			metadata: projects.metadata,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
			ownerCompanyName: companies.name,
		})
		.from(projects)
		.leftJoin(companies, eq(projects.ownerCompanyId, companies.id))
		.where(and(eq(projects.id, id), eq(projects.organizationId, tenantId)))
		.limit(1)

	if (!rows[0]) return null

	const linkedDeals = await listProjectDeals(db, tenantId, id)

	return { ...rows[0], linkedDeals }
}

export async function create(db: DrizzleDB, tenantId: string, input: CreateProjectInput) {
	const id = nanoid()
	const [created] = await db
		.insert(projects)
		.values({
			id,
			organizationId: tenantId,
			ownerCompanyId: input.ownerCompanyId,
			name: input.name,
			projectStatus: input.projectStatus ?? 'exploration',
			country: input.country || null,
			stateProvince: input.stateProvince || null,
			nearestTown: input.nearestTown || null,
			latitude: input.latitude != null ? String(input.latitude) : null,
			longitude: input.longitude != null ? String(input.longitude) : null,
			primaryCommodity: input.primaryCommodity,
			secondaryCommodities: input.secondaryCommodities ?? [],
			resourceEstimate: input.resourceEstimate || null,
			reserveEstimate: input.reserveEstimate || null,
			reportingStandard: input.reportingStandard || null,
			tenureType: input.tenureType || null,
			tenureExpiry: input.tenureExpiry ? new Date(input.tenureExpiry) : null,
			tenureArea: input.tenureArea || null,
			capexEstimate: input.capexEstimate || null,
			npv: input.npv || null,
			irr: input.irr || null,
			description: input.description || null,
			stageOfStudy: input.stageOfStudy || null,
		})
		.returning()

	return created
}

export async function update(db: DrizzleDB, tenantId: string, id: string, input: UpdateProjectInput) {
	const values: Record<string, unknown> = { updatedAt: new Date() }

	if (input.name !== undefined) values.name = input.name
	if (input.ownerCompanyId !== undefined) values.ownerCompanyId = input.ownerCompanyId
	if (input.projectStatus !== undefined) values.projectStatus = input.projectStatus
	if (input.country !== undefined) values.country = input.country || null
	if (input.stateProvince !== undefined) values.stateProvince = input.stateProvince || null
	if (input.nearestTown !== undefined) values.nearestTown = input.nearestTown || null
	if (input.latitude !== undefined) values.latitude = input.latitude != null ? String(input.latitude) : null
	if (input.longitude !== undefined) values.longitude = input.longitude != null ? String(input.longitude) : null
	if (input.primaryCommodity !== undefined) values.primaryCommodity = input.primaryCommodity
	if (input.secondaryCommodities !== undefined) values.secondaryCommodities = input.secondaryCommodities
	if (input.resourceEstimate !== undefined) values.resourceEstimate = input.resourceEstimate || null
	if (input.reserveEstimate !== undefined) values.reserveEstimate = input.reserveEstimate || null
	if (input.reportingStandard !== undefined) values.reportingStandard = input.reportingStandard || null
	if (input.tenureType !== undefined) values.tenureType = input.tenureType || null
	if (input.tenureExpiry !== undefined) values.tenureExpiry = input.tenureExpiry ? new Date(input.tenureExpiry) : null
	if (input.tenureArea !== undefined) values.tenureArea = input.tenureArea || null
	if (input.capexEstimate !== undefined) values.capexEstimate = input.capexEstimate || null
	if (input.npv !== undefined) values.npv = input.npv || null
	if (input.irr !== undefined) values.irr = input.irr || null
	if (input.description !== undefined) values.description = input.description || null
	if (input.stageOfStudy !== undefined) values.stageOfStudy = input.stageOfStudy || null

	const [updated] = await db
		.update(projects)
		.set(values)
		.where(and(eq(projects.id, id), eq(projects.organizationId, tenantId)))
		.returning()

	if (!updated) {
		throw new Error('Project not found')
	}

	return updated
}

export async function remove(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(projects)
		.where(and(eq(projects.id, id), eq(projects.organizationId, tenantId)))
		.returning({ id: projects.id })

	if (!deleted) {
		throw new Error('Project not found')
	}

	return { success: true as const }
}

// =============================================================================
// Project-Deal Links
// =============================================================================

export async function listProjectDeals(db: DrizzleDB, tenantId: string, projectId: string) {
	return db
		.select({
			id: projectDeals.id,
			projectId: projectDeals.projectId,
			dealId: projectDeals.dealId,
			role: projectDeals.role,
			createdAt: projectDeals.createdAt,
			deal: {
				id: deals.id,
				name: deals.name,
				dealType: deals.dealType,
			},
		})
		.from(projectDeals)
		.leftJoin(deals, eq(projectDeals.dealId, deals.id))
		.where(
			and(
				eq(projectDeals.projectId, projectId),
				eq(projectDeals.organizationId, tenantId),
			),
		)
}

export async function linkDeal(db: DrizzleDB, tenantId: string, input: CreateProjectDealInput) {
	const id = nanoid()
	const [created] = await db
		.insert(projectDeals)
		.values({
			id,
			organizationId: tenantId,
			projectId: input.projectId,
			dealId: input.dealId,
			role: input.role ?? 'subject_asset',
		})
		.returning()

	return created
}

export async function unlinkDeal(db: DrizzleDB, tenantId: string, id: string) {
	const [deleted] = await db
		.delete(projectDeals)
		.where(and(eq(projectDeals.id, id), eq(projectDeals.organizationId, tenantId)))
		.returning({ id: projectDeals.id })

	if (!deleted) {
		throw new Error('Project-deal link not found')
	}

	return { success: true as const }
}
