import type { DealParticipantRole, DealType, InvestorType } from '../types/index'
import type { ActivityType } from '../validators/activities'
import type { EntityType } from '../validators/companies'
import type { ContactStatus } from '../validators/contacts'
import type { ContactCompanyRole, CompanyRelationshipType } from '../validators/associations'

export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
	{ value: 'startup', label: 'Startup' },
	{ value: 'listed_company', label: 'Listed Company' },
	{ value: 'investor', label: 'Investor' },
	{ value: 'investment_firm', label: 'Investment Firm' },
	{ value: 'mining_company', label: 'Mining Company' },
	{ value: 'private_company', label: 'Private Company' },
	{ value: 'service_provider', label: 'Service Provider' },
	{ value: 'mineral_processor', label: 'Mineral Processor' },
	{ value: 'commodity_trader', label: 'Commodity Trader' },
	{ value: 'mining_services', label: 'Mining Services' },
	{ value: 'exploration_company', label: 'Exploration Company' },
	{ value: 'other', label: 'Other' },
]

export const DEAL_TYPES: { value: DealType; label: string }[] = [
	// Capital markets
	{ value: 'venture_investment', label: 'Venture Investment' },
	{ value: 'ma_buyside', label: 'M&A (Buy-side)' },
	{ value: 'ma_sellside', label: 'M&A (Sell-side)' },
	{ value: 'fundraising', label: 'Fundraising' },
	{ value: 'ipo', label: 'IPO' },
	{ value: 'secondary', label: 'Secondary' },
	{ value: 'debt', label: 'Debt' },
	{ value: 'advisory', label: 'Advisory' },
	// Mining & resources
	{ value: 'asset_acquisition', label: 'Asset Acquisition' },
	{ value: 'joint_venture', label: 'Joint Venture' },
	{ value: 'offtake_agreement', label: 'Offtake Agreement' },
	{ value: 'royalty_streaming_deal', label: 'Royalty / Streaming Deal' },
	{ value: 'farm_in_farm_out', label: 'Farm-In / Farm-Out' },
	{ value: 'project_sale', label: 'Project Sale' },
	{ value: 'equity_placement', label: 'Equity Placement' },
	{ value: 'technical_study', label: 'Technical Study' },
	{ value: 'option_to_acquire', label: 'Option to Acquire' },
]

export const INVESTOR_TYPES: { value: InvestorType; label: string }[] = [
	{ value: 'vc', label: 'Venture Capital' },
	{ value: 'pe', label: 'Private Equity' },
	{ value: 'angel', label: 'Angel' },
	{ value: 'family_office', label: 'Family Office' },
	{ value: 'hedge_fund', label: 'Hedge Fund' },
	{ value: 'sovereign_wealth', label: 'Sovereign Wealth' },
]

export const CONTACT_ROLE_OPTIONS: { value: ContactCompanyRole; label: string }[] = [
	{ value: 'founder', label: 'Founder' },
	{ value: 'ceo', label: 'CEO' },
	{ value: 'cfo', label: 'CFO' },
	{ value: 'cto', label: 'CTO' },
	{ value: 'partner', label: 'Partner' },
	{ value: 'managing_director', label: 'Managing Director' },
	{ value: 'vice_president', label: 'Vice President' },
	{ value: 'director', label: 'Director' },
	{ value: 'analyst', label: 'Analyst' },
	{ value: 'associate', label: 'Associate' },
	{ value: 'board_member', label: 'Board Member' },
	{ value: 'advisor', label: 'Advisor' },
	{ value: 'investor', label: 'Investor' },
	{ value: 'other', label: 'Other' },
]

export const DEAL_PARTICIPANT_ROLES: { value: DealParticipantRole; label: string }[] = [
	// Capital markets
	{ value: 'target', label: 'Target' },
	{ value: 'acquirer', label: 'Acquirer' },
	{ value: 'investor', label: 'Investor' },
	{ value: 'lead_investor', label: 'Lead Investor' },
	{ value: 'co_investor', label: 'Co-Investor' },
	{ value: 'advisor', label: 'Advisor' },
	{ value: 'legal_counsel', label: 'Legal Counsel' },
	{ value: 'intermediary', label: 'Intermediary' },
	// Mining & resources
	{ value: 'project_owner', label: 'Project Owner' },
	{ value: 'jv_partner', label: 'JV Partner' },
	{ value: 'offtake_buyer', label: 'Offtake Buyer' },
	{ value: 'offtake_seller', label: 'Offtake Seller' },
	{ value: 'operator', label: 'Operator' },
	{ value: 'technical_consultant', label: 'Technical Consultant' },
	{ value: 'geologist', label: 'Geologist' },
]

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
	{ value: 'meeting', label: 'Meeting' },
	{ value: 'call', label: 'Call' },
	{ value: 'email', label: 'Email' },
	{ value: 'note', label: 'Note' },
	{ value: 'task', label: 'Task' },
	{ value: 'deal_update', label: 'Deal Update' },
]

export const CONTACT_STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
	{ value: 'lead', label: 'Lead' },
	{ value: 'churned', label: 'Churned' },
]

export const COMPANY_RELATIONSHIP_TYPE_OPTIONS: { value: CompanyRelationshipType; label: string }[] = [
	// Capital markets
	{ value: 'investor_in', label: 'Investor In' },
	{ value: 'portfolio_company_of', label: 'Portfolio Company Of' },
	{ value: 'subsidiary_of', label: 'Subsidiary Of' },
	{ value: 'parent_of', label: 'Parent Of' },
	{ value: 'partner_with', label: 'Partner With' },
	{ value: 'client_of', label: 'Client Of' },
	{ value: 'vendor_to', label: 'Vendor To' },
	{ value: 'acquirer_of', label: 'Acquirer Of' },
	{ value: 'acquired_by', label: 'Acquired By' },
	{ value: 'competitor_of', label: 'Competitor Of' },
	// Mining & resources
	{ value: 'jv_partner_with', label: 'JV Partner With' },
	{ value: 'offtake_buyer_of', label: 'Offtake Buyer Of' },
	{ value: 'offtake_seller_to', label: 'Offtake Seller To' },
	{ value: 'operator_of', label: 'Operator Of' },
]

export const TAG_COLOR_OPTIONS: { value: string; label: string }[] = [
	{ value: '#3B82F6', label: 'Blue' },
	{ value: '#EF4444', label: 'Red' },
	{ value: '#10B981', label: 'Green' },
	{ value: '#F59E0B', label: 'Amber' },
	{ value: '#8B5CF6', label: 'Purple' },
	{ value: '#EC4899', label: 'Pink' },
	{ value: '#6B7280', label: 'Gray' },
]

/** Default pipeline stages for a new VC Deal Flow pipeline */
export const DEFAULT_VC_PIPELINE_STAGES = [
	{ name: 'Sourced', position: 0, color: '#6B7280' },
	{ name: 'First Meeting', position: 1, color: '#3B82F6' },
	{ name: 'Due Diligence', position: 2, color: '#F59E0B' },
	{ name: 'IC Review', position: 3, color: '#8B5CF6' },
	{ name: 'Term Sheet', position: 4, color: '#EC4899' },
	{ name: 'Closed Won', position: 5, color: '#10B981', isTerminal: true, terminalType: 'won' as const },
	{ name: 'Passed', position: 6, color: '#EF4444', isTerminal: true, terminalType: 'passed' as const },
]

/** Default pipeline stages for a Mining Asset Acquisition pipeline */
export const DEFAULT_MINING_ACQUISITION_STAGES = [
	{ name: 'Identified', position: 0, color: '#6B7280' },
	{ name: 'Initial Review', position: 1, color: '#3B82F6' },
	{ name: 'Site Visit', position: 2, color: '#06B6D4' },
	{ name: 'Due Diligence', position: 3, color: '#F59E0B' },
	{ name: 'Negotiation', position: 4, color: '#8B5CF6' },
	{ name: 'Binding Agreement', position: 5, color: '#EC4899' },
	{ name: 'Completed', position: 6, color: '#10B981', isTerminal: true, terminalType: 'won' as const },
	{ name: 'Withdrawn', position: 7, color: '#EF4444', isTerminal: true, terminalType: 'withdrawn' as const },
]

/** Default pipeline stages for a Joint Venture pipeline */
export const DEFAULT_JV_PIPELINE_STAGES = [
	{ name: 'Prospect', position: 0, color: '#6B7280' },
	{ name: 'NDA Signed', position: 1, color: '#3B82F6' },
	{ name: 'Data Room', position: 2, color: '#06B6D4' },
	{ name: 'Technical Review', position: 3, color: '#F59E0B' },
	{ name: 'HOA', position: 4, color: '#8B5CF6' },
	{ name: 'JV Agreement', position: 5, color: '#EC4899' },
	{ name: 'Executed', position: 6, color: '#10B981', isTerminal: true, terminalType: 'won' as const },
	{ name: 'Passed', position: 7, color: '#EF4444', isTerminal: true, terminalType: 'passed' as const },
]

export * from './verticals'
