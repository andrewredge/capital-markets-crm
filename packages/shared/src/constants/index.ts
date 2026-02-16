import type { ActivityType, DealParticipantRole, DealType, InvestorType } from '../types/index'
import type { EntityType } from '../validators/companies'
import type { ContactStatus } from '../validators/contacts'
import type { ContactCompanyRole, CompanyRelationshipType } from '../validators/associations'

export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
	{ value: 'startup', label: 'Startup' },
	{ value: 'listed_company', label: 'Listed Company' },
	{ value: 'investor', label: 'Investor' },
	{ value: 'service_provider', label: 'Service Provider' },
]

export const DEAL_TYPES: { value: DealType; label: string }[] = [
	{ value: 'venture_investment', label: 'Venture Investment' },
	{ value: 'ma_buyside', label: 'M&A (Buy-side)' },
	{ value: 'ma_sellside', label: 'M&A (Sell-side)' },
	{ value: 'fundraising', label: 'Fundraising' },
	{ value: 'ipo', label: 'IPO' },
	{ value: 'secondary', label: 'Secondary' },
	{ value: 'debt', label: 'Debt' },
	{ value: 'advisory', label: 'Advisory' },
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
	{ value: 'target', label: 'Target' },
	{ value: 'acquirer', label: 'Acquirer' },
	{ value: 'investor', label: 'Investor' },
	{ value: 'lead_investor', label: 'Lead Investor' },
	{ value: 'co_investor', label: 'Co-Investor' },
	{ value: 'advisor', label: 'Advisor' },
	{ value: 'legal_counsel', label: 'Legal Counsel' },
	{ value: 'intermediary', label: 'Intermediary' },
]

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
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
