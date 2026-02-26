import { z } from 'zod'

// =============================================================================
// Project Validators
// =============================================================================

export const PROJECT_STATUS_VALUES = [
	'exploration',
	'development',
	'production',
	'care_and_maintenance',
	'closed',
] as const
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

export const COMMODITY_VALUES = [
	// Precious metals
	'gold', 'silver', 'platinum', 'palladium',
	// Base metals
	'copper', 'zinc', 'lead', 'nickel', 'tin', 'aluminium',
	// Battery / critical minerals
	'lithium', 'cobalt', 'manganese', 'graphite', 'rare_earths', 'vanadium',
	// Bulk commodities
	'iron_ore', 'coal', 'bauxite', 'potash', 'phosphate',
	// Energy
	'uranium',
	// Industrial
	'silica', 'limestone', 'kaolin',
	// Other
	'other',
] as const
export type Commodity = (typeof COMMODITY_VALUES)[number]

export const REPORTING_STANDARDS = [
	'jorc', 'ni_43_101', 'samrec', 'sec_sk_1300', 'cim', 'perc', 'other',
] as const
export type ReportingStandard = (typeof REPORTING_STANDARDS)[number]

export const STAGE_OF_STUDY_VALUES = [
	'conceptual', 'scoping', 'pre_feasibility', 'definitive_feasibility',
	'bankable_feasibility', 'expansion_study', 'other',
] as const
export type StageOfStudy = (typeof STAGE_OF_STUDY_VALUES)[number]

export const TENURE_TYPES = [
	'mining_lease', 'exploration_license', 'prospecting_license',
	'retention_license', 'mineral_development_license', 'other',
] as const
export type TenureType = (typeof TENURE_TYPES)[number]

export const PROJECT_DEAL_ROLES = [
	'subject_asset', 'comparison_asset', 'retained_interest',
] as const
export type ProjectDealRole = (typeof PROJECT_DEAL_ROLES)[number]

// =============================================================================
// Schemas
// =============================================================================

export const createProjectSchema = z.object({
	name: z.string().min(1, 'Project name is required').max(200),
	ownerCompanyId: z.string().min(1, 'Owner company is required'),
	projectStatus: z.enum(PROJECT_STATUS_VALUES).default('exploration'),
	// Location
	country: z.string().max(100).optional().or(z.literal('')),
	stateProvince: z.string().max(100).optional().or(z.literal('')),
	nearestTown: z.string().max(100).optional().or(z.literal('')),
	latitude: z.number().min(-90).max(90).optional().nullable(),
	longitude: z.number().min(-180).max(180).optional().nullable(),
	// Geology
	primaryCommodity: z.enum(COMMODITY_VALUES),
	secondaryCommodities: z.array(z.enum(COMMODITY_VALUES)).optional().default([]),
	resourceEstimate: z.string().max(500).optional().or(z.literal('')),
	reserveEstimate: z.string().max(500).optional().or(z.literal('')),
	reportingStandard: z.enum(REPORTING_STANDARDS).optional(),
	// Tenure
	tenureType: z.enum(TENURE_TYPES).optional(),
	tenureExpiry: z.string().optional().or(z.literal('')),
	tenureArea: z.string().max(200).optional().or(z.literal('')),
	// Financial
	capexEstimate: z.string().max(100).optional().or(z.literal('')),
	npv: z.string().max(100).optional().or(z.literal('')),
	irr: z.string().max(50).optional().or(z.literal('')),
	// General
	description: z.string().optional().or(z.literal('')),
	stageOfStudy: z.enum(STAGE_OF_STUDY_VALUES).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const projectFilterSchema = z.object({
	search: z.string().optional(),
	projectStatus: z.enum(PROJECT_STATUS_VALUES).optional(),
	primaryCommodity: z.enum(COMMODITY_VALUES).optional(),
	ownerCompanyId: z.string().optional(),
	sortBy: z.string().optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// Junction: link project to deal
export const createProjectDealSchema = z.object({
	projectId: z.string().min(1),
	dealId: z.string().min(1),
	role: z.enum(PROJECT_DEAL_ROLES).default('subject_asset'),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>
export type CreateProjectDealInput = z.infer<typeof createProjectDealSchema>
