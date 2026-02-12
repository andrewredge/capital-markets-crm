// Shared TypeScript types

/** Entity types for companies in the capital markets ecosystem */
export type EntityType = 'startup' | 'listed_company' | 'investor' | 'service_provider'

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

/** Contact-company relationship roles */
export type ContactRole =
	| 'ceo'
	| 'cfo'
	| 'cto'
	| 'partner'
	| 'managing_director'
	| 'director'
	| 'vp'
	| 'analyst'
	| 'associate'
	| 'board_member'
	| 'advisor'
	| 'founder'
	| 'other'

/** Company-to-company relationship types */
export type CompanyRelationshipType =
	| 'subsidiary'
	| 'investor_in'
	| 'portfolio_co'
	| 'advisor_to'
	| 'co_investor'

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

/** Contact status */
export type ContactStatus = 'active' | 'inactive' | 'prospect' | 'archived'

/** Pipeline stage terminal types */
export type TerminalType = 'won' | 'lost' | 'passed'
