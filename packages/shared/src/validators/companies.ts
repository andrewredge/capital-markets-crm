import { z } from 'zod'

// =============================================================================
// Company Validators
// =============================================================================

export const ENTITY_TYPES = ['startup', 'listed_company', 'investor', 'service_provider'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const createCompanySchema = z.object({
	name: z.string().min(1, 'Company name is required').max(200),
	entityType: z.enum(ENTITY_TYPES, {
		errorMap: () => ({ message: 'Entity type is required' }),
	}),
	// Common fields
	website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
	industry: z.string().max(100).optional().or(z.literal('')),
	headquarters: z.string().max(200).optional().or(z.literal('')),
	foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
	employeeCountRange: z.string().max(50).optional().or(z.literal('')),
	// Investor-specific
	investorType: z.string().max(100).optional().or(z.literal('')),
	aum: z.string().max(50).optional().or(z.literal('')),
	investmentStageFocus: z.array(z.string()).optional(),
	// Listed company-specific
	tickerSymbol: z.string().max(20).optional().or(z.literal('')),
	exchange: z.string().max(50).optional().or(z.literal('')),
	marketCap: z.string().max(50).optional().or(z.literal('')),
	// Startup-specific
	fundingStage: z.string().max(50).optional().or(z.literal('')),
	totalFunding: z.string().max(50).optional().or(z.literal('')),
})

export const updateCompanySchema = createCompanySchema.partial()

export const companyFilterSchema = z.object({
	search: z.string().optional(),
	entityType: z.enum(ENTITY_TYPES).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CompanyFilterInput = z.infer<typeof companyFilterSchema>
