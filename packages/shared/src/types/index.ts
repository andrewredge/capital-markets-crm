// Shared TypeScript types

// EntityType — now derived from Zod schema in validators/companies.ts

/** Deal types — derived from validators/deals.ts DEAL_TYPE_VALUES */
export type DealType =
	| 'venture_investment'
	| 'ma_buyside'
	| 'ma_sellside'
	| 'fundraising'
	| 'ipo'
	| 'secondary'
	| 'debt'
	| 'advisory'
	// Mining & resources
	| 'asset_acquisition'
	| 'joint_venture'
	| 'offtake_agreement'
	| 'royalty_streaming_deal'
	| 'farm_in_farm_out'
	| 'project_sale'
	| 'equity_placement'
	| 'technical_study'
	| 'option_to_acquire'

/** Organization roles */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

// PlatformRole — now derived from Zod schema in validators/platform-admin.ts
// AccountStatus — now derived from Zod schema in validators/platform-admin.ts

/** Industry vertical for org-level configuration */
export type IndustryVertical = 'capital_markets' | 'mining_resources' | 'general'

// ContactCompanyRole — now derived from Zod schema in validators/associations.ts
// CompanyRelationshipType — now derived from Zod schema in validators/associations.ts

/** Deal participant roles — derived from validators/deals.ts */
export type DealParticipantRole =
	| 'target'
	| 'acquirer'
	| 'investor'
	| 'lead_investor'
	| 'co_investor'
	| 'advisor'
	| 'legal_counsel'
	| 'intermediary'
	// Mining & resources
	| 'project_owner'
	| 'jv_partner'
	| 'offtake_buyer'
	| 'offtake_seller'
	| 'operator'
	| 'technical_consultant'
	| 'geologist'

/** Investor types */
export type InvestorType = 'vc' | 'pe' | 'angel' | 'family_office' | 'hedge_fund' | 'sovereign_wealth'

// ActivityType — now derived from Zod schema in validators/activities.ts

// ContactStatus — now derived from Zod schema in validators/contacts.ts

// TerminalType — now derived from Zod schema in validators/pipelines.ts
