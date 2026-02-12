import type {
	ActivityType,
	ContactRole,
	ContactStatus,
	DealParticipantRole,
	DealType,
	EntityType,
	InvestorType,
} from '../types/index.js'

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
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

export const CONTACT_ROLES: { value: ContactRole; label: string }[] = [
	{ value: 'ceo', label: 'CEO' },
	{ value: 'cfo', label: 'CFO' },
	{ value: 'cto', label: 'CTO' },
	{ value: 'partner', label: 'Partner' },
	{ value: 'managing_director', label: 'Managing Director' },
	{ value: 'director', label: 'Director' },
	{ value: 'vp', label: 'VP' },
	{ value: 'analyst', label: 'Analyst' },
	{ value: 'associate', label: 'Associate' },
	{ value: 'board_member', label: 'Board Member' },
	{ value: 'advisor', label: 'Advisor' },
	{ value: 'founder', label: 'Founder' },
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

export const CONTACT_STATUSES: { value: ContactStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
	{ value: 'prospect', label: 'Prospect' },
	{ value: 'archived', label: 'Archived' },
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
