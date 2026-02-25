import { z } from 'zod'

// =============================================================================
// Company Validators
// =============================================================================

export const ENTITY_TYPES = [
	'startup',
	'listed_company',
	'investor',
	'investment_firm',
	'mining_company',
	'private_company',
	'service_provider',
	'other',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

/** Subtypes per entity type */
export const ENTITY_SUBTYPES = {
	startup: ['pre_revenue', 'early_revenue', 'growth_stage', 'pre_ipo'],
	listed_company: ['large_cap', 'mid_cap', 'small_cap', 'micro_cap'],
	investor: ['angel_investor', 'syndicate_lead', 'high_net_worth', 'retail_investor'],
	investment_firm: [
		'venture_capital',
		'private_equity',
		'growth_equity',
		'hedge_fund',
		'quant_fund',
		'special_situations',
		'distressed_debt',
		'mezzanine',
		'mutual_fund',
		'pension_fund',
		'sovereign_wealth_fund',
		'fund_of_funds',
		'real_estate_fund',
		'infrastructure_fund',
		'credit_fund',
		'family_office',
		'endowment',
	],
	mining_company: ['explorer', 'developer', 'producer', 'royalty_streaming', 'diversified_miner'],
	private_company: ['sme', 'family_business', 'state_owned', 'cooperative', 'joint_venture'],
	service_provider: [
		'law_firm',
		'accounting_firm',
		'investment_bank',
		'commercial_bank',
		'corporate_advisory',
		'broker_dealer',
		'consulting_firm',
		'transfer_agent',
		'pr_communications',
		'technology_provider',
		'fund_administrator',
	],
	other: ['industry_body', 'ngo', 'government_entity', 'exchange', 'unclassified'],
} as const satisfies Record<EntityType, readonly string[]>

/** Flat array of all valid entity subtypes */
export const ALL_ENTITY_SUBTYPES = Object.values(ENTITY_SUBTYPES).flat()
export type EntitySubtype = (typeof ALL_ENTITY_SUBTYPES)[number]

/** Human-readable labels for entity subtypes */
export const ENTITY_SUBTYPE_LABELS: Record<string, string> = {
	// startup
	pre_revenue: 'Pre-Revenue',
	early_revenue: 'Early Revenue',
	growth_stage: 'Growth Stage',
	pre_ipo: 'Pre-IPO',
	// listed_company
	large_cap: 'Large Cap (>$10B)',
	mid_cap: 'Mid Cap ($2B–$10B)',
	small_cap: 'Small Cap ($300M–$2B)',
	micro_cap: 'Micro Cap (<$300M)',
	// investor
	angel_investor: 'Angel Investor',
	syndicate_lead: 'Syndicate Lead',
	high_net_worth: 'High Net Worth Individual',
	retail_investor: 'Retail Investor',
	// investment_firm
	venture_capital: 'Venture Capital',
	private_equity: 'Private Equity',
	growth_equity: 'Growth Equity',
	hedge_fund: 'Hedge Fund',
	quant_fund: 'Quant Fund',
	special_situations: 'Special Situations',
	distressed_debt: 'Distressed Debt',
	mezzanine: 'Mezzanine',
	mutual_fund: 'Mutual Fund',
	pension_fund: 'Pension Fund',
	sovereign_wealth_fund: 'Sovereign Wealth Fund',
	fund_of_funds: 'Fund of Funds',
	real_estate_fund: 'Real Estate Fund',
	infrastructure_fund: 'Infrastructure Fund',
	credit_fund: 'Credit Fund',
	family_office: 'Family Office',
	endowment: 'Endowment',
	// mining_company
	explorer: 'Explorer',
	developer: 'Developer',
	producer: 'Producer',
	royalty_streaming: 'Royalty & Streaming',
	diversified_miner: 'Diversified Miner',
	// private_company
	sme: 'SME',
	family_business: 'Family Business',
	state_owned: 'State-Owned Enterprise',
	cooperative: 'Cooperative',
	joint_venture: 'Joint Venture',
	// service_provider
	law_firm: 'Law Firm',
	accounting_firm: 'Accounting Firm',
	investment_bank: 'Investment Bank',
	commercial_bank: 'Commercial Bank',
	corporate_advisory: 'Corporate Advisory',
	broker_dealer: 'Broker-Dealer',
	consulting_firm: 'Consulting Firm',
	transfer_agent: 'Transfer Agent',
	pr_communications: 'PR & Communications',
	technology_provider: 'Technology Provider',
	fund_administrator: 'Fund Administrator',
	// other
	industry_body: 'Industry Body',
	ngo: 'NGO / Non-Profit',
	government_entity: 'Government Entity',
	exchange: 'Exchange / Clearinghouse',
	unclassified: 'Unclassified',
}

export const LISTING_STATUSES = ['listed', 'private', 'unknown'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const createCompanySchema = z.object({
	name: z.string().min(1, 'Company name is required').max(200),
	entityType: z.enum(ENTITY_TYPES, {
		errorMap: () => ({ message: 'Entity type is required' }),
	}),
	entitySubtype: z.string().max(50).optional().or(z.literal('')),
	listingStatus: z.enum(LISTING_STATUSES).default('unknown'),
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
	entitySubtype: z.string().optional(),
	listingStatus: z.enum(LISTING_STATUSES).optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(25),
})

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CompanyFilterInput = z.infer<typeof companyFilterSchema>
