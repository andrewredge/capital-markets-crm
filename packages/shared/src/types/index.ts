// Shared TypeScript types

// EntityType — now derived from Zod schema in validators/companies.ts

/** Deal types in capital markets */
export type DealType =
	| 'venture_investment'
	| 'ma_buyside'
	| 'ma_sellside'
	| 'fundraising'
	| 'ipo'
	| 'secondary'
	| 'debt'
	| 'advisory'

/** Organization roles */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

// ContactCompanyRole — now derived from Zod schema in validators/associations.ts
// CompanyRelationshipType — now derived from Zod schema in validators/associations.ts

/** Deal participant roles */
export type DealParticipantRole =
	| 'target'
	| 'acquirer'
	| 'investor'
	| 'lead_investor'
	| 'co_investor'
	| 'advisor'
	| 'legal_counsel'
	| 'intermediary'

/** Investor types */
export type InvestorType = 'vc' | 'pe' | 'angel' | 'family_office' | 'hedge_fund' | 'sovereign_wealth'

/** Activity types for interaction logging */
export type ActivityType = 'meeting' | 'call' | 'email' | 'note' | 'task' | 'deal_update'

// ContactStatus — now derived from Zod schema in validators/contacts.ts

/** Pipeline stage terminal types */
export type TerminalType = 'won' | 'lost' | 'passed'
