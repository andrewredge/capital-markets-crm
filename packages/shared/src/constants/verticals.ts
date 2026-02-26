import type { IndustryVertical } from '../types/index'

/**
 * Maps industry verticals to the deal types they should display.
 * 'general' shows everything.
 */
export const VERTICAL_DEAL_TYPES: Record<IndustryVertical, readonly string[]> = {
	capital_markets: [
		'venture_investment', 'ma_buyside', 'ma_sellside', 'fundraising',
		'ipo', 'secondary', 'debt', 'advisory',
	],
	mining_resources: [
		'asset_acquisition', 'joint_venture', 'offtake_agreement',
		'royalty_streaming_deal', 'farm_in_farm_out', 'project_sale',
		'equity_placement', 'technical_study', 'option_to_acquire',
	],
	general: [], // empty = show all
}

/**
 * Maps industry verticals to the entity types they should display.
 */
export const VERTICAL_ENTITY_TYPES: Record<IndustryVertical, readonly string[]> = {
	capital_markets: [
		'startup', 'listed_company', 'investor', 'investment_firm',
		'private_company', 'service_provider', 'other',
	],
	mining_resources: [
		'mining_company', 'listed_company', 'mineral_processor',
		'commodity_trader', 'mining_services', 'exploration_company',
		'investor', 'investment_firm', 'service_provider', 'private_company', 'other',
	],
	general: [],
}

/**
 * Maps industry verticals to the participant roles they should display.
 */
export const VERTICAL_PARTICIPANT_ROLES: Record<IndustryVertical, readonly string[]> = {
	capital_markets: [
		'target', 'acquirer', 'investor', 'lead_investor', 'co_investor',
		'advisor', 'legal_counsel', 'intermediary',
	],
	mining_resources: [
		'project_owner', 'jv_partner', 'offtake_buyer', 'offtake_seller',
		'operator', 'technical_consultant', 'geologist',
		'advisor', 'legal_counsel', 'intermediary', 'investor',
	],
	general: [],
}

/**
 * Maps industry verticals to the relationship types they should display.
 */
export const VERTICAL_RELATIONSHIP_TYPES: Record<IndustryVertical, readonly string[]> = {
	capital_markets: [
		'investor_in', 'portfolio_company_of', 'subsidiary_of', 'parent_of',
		'partner_with', 'client_of', 'vendor_to', 'acquirer_of', 'acquired_by', 'competitor_of',
	],
	mining_resources: [
		'jv_partner_with', 'offtake_buyer_of', 'offtake_seller_to', 'operator_of',
		'subsidiary_of', 'parent_of', 'partner_with', 'client_of', 'vendor_to',
		'acquirer_of', 'acquired_by', 'competitor_of',
	],
	general: [],
}

export const INDUSTRY_VERTICAL_OPTIONS: { value: IndustryVertical; label: string }[] = [
	{ value: 'capital_markets', label: 'Capital Markets' },
	{ value: 'mining_resources', label: 'Mining & Resources' },
	{ value: 'general', label: 'General' },
]
