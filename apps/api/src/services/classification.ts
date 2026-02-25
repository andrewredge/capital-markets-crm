import type {
	ContactType,
	EntityType,
	ListingStatus,
} from '@crm/shared'

// =============================================================================
// Contact Classification — infer type/subtype from title string
// =============================================================================

const TITLE_TO_CONTACT_TYPE: [RegExp, ContactType, string][] = [
	// board_member (check before director)
	[/\bchairman\b/i, 'board_member', 'chairman'],
	[/\bchairwoman\b/i, 'board_member', 'chairman'],
	[/\bchairperson\b/i, 'board_member', 'chairman'],
	[/\bvice[\s-]?chair/i, 'board_member', 'vice_chairman'],
	[/\bboard\s+observer\b/i, 'board_member', 'board_observer'],
	// founder
	[/\bco[\s-]?founder\b/i, 'founder', 'co_founder'],
	[/\btechnical\s+founder\b/i, 'founder', 'technical_founder'],
	[/\bfounder\b/i, 'founder', 'sole_founder'],
	// director
	[/\bindependent\s+(non[\s-]?executive\s+)?director\b/i, 'director', 'independent_director'],
	[/\bnon[\s-]?executive\s+director\b/i, 'director', 'non_executive_director'],
	[/\bexecutive\s+director\b/i, 'director', 'executive_director'],
	[/\balternate\s+director\b/i, 'director', 'alternate_director'],
	// shareholder (from title — uncommon but possible)
	[/\bbeneficial\s+owner\b/i, 'shareholder', 'beneficial_owner'],
	[/\bcontrolling\s+shareholder\b/i, 'shareholder', 'controlling_shareholder'],
	[/\bmajor\s+shareholder\b/i, 'shareholder', 'major_shareholder'],
	[/\bshareholder\b/i, 'shareholder', 'major_shareholder'],
	// advisor
	[/\bfinancial\s+advi[sz]or\b/i, 'advisor', 'financial_advisor'],
	[/\blegal\s+(advi[sz]or|counsel)\b/i, 'advisor', 'legal_advisor'],
	[/\btechnical\s+advi[sz]or\b/i, 'advisor', 'technical_advisor'],
	[/\bstrategic\s+advi[sz]or\b/i, 'advisor', 'strategic_advisor'],
	[/\badvi[sz]or\b/i, 'advisor', 'strategic_advisor'],
	// key_person
	[/\bcompany\s+secretary\b/i, 'key_person', 'company_secretary'],
	[/\btrustee\b/i, 'key_person', 'trustee'],
	// employee — c_suite
	[/\b(ceo|chief\s+executive)\b/i, 'employee', 'c_suite'],
	[/\b(cfo|chief\s+financial)\b/i, 'employee', 'c_suite'],
	[/\b(cto|chief\s+technology|chief\s+technical)\b/i, 'employee', 'c_suite'],
	[/\b(coo|chief\s+operating)\b/i, 'employee', 'c_suite'],
	[/\b(cio|chief\s+information|chief\s+investment)\b/i, 'employee', 'c_suite'],
	[/\bchief\s+\w+\s+officer\b/i, 'employee', 'c_suite'],
	// employee — senior_management
	[/\bmanaging\s+director\b/i, 'employee', 'senior_management'],
	[/\bsenior\s+vice\s+president\b/i, 'employee', 'senior_management'],
	[/\b(svp|evp)\b/i, 'employee', 'senior_management'],
	[/\bpartner\b/i, 'employee', 'senior_management'],
	[/\bprincipal\b/i, 'employee', 'senior_management'],
	// employee — middle_management
	[/\bvice\s+president\b/i, 'employee', 'middle_management'],
	[/\b(vp)\b/i, 'employee', 'middle_management'],
	[/\bdirector\b/i, 'employee', 'middle_management'],
	[/\bhead\s+of\b/i, 'employee', 'middle_management'],
	[/\bgeneral\s+manager\b/i, 'employee', 'middle_management'],
	// employee — professional
	[/\bsenior\s+analyst\b/i, 'employee', 'professional'],
	[/\banalyst\b/i, 'employee', 'professional'],
	[/\bassociate\b/i, 'employee', 'professional'],
	[/\bspecialist\b/i, 'employee', 'professional'],
	[/\bengineer\b/i, 'employee', 'professional'],
	// employee — operations
	[/\boperation/i, 'employee', 'operations'],
	[/\bcompliance\b/i, 'employee', 'operations'],
	[/\badmin/i, 'employee', 'operations'],
	// person — specific subtypes
	[/\bsenator\b|\bminister\b|\bgovernor\b|\bcommissioner\b|\bregulat/i, 'person', 'government_official'],
	[/\bjournalist\b|\breporter\b|\beditor\b/i, 'person', 'journalist'],
	[/\bprofessor\b|\bresearch/i, 'person', 'academic'],
]

export interface ContactClassification {
	contactType: ContactType
	contactSubtype: string
}

/**
 * Infer contact type and subtype from a job title string.
 * Returns null if no pattern matches (caller should default to 'person'/'general').
 */
export function classifyContact(title: string | null | undefined): ContactClassification {
	if (!title || !title.trim()) {
		return { contactType: 'person', contactSubtype: 'general' }
	}

	for (const [pattern, type, subtype] of TITLE_TO_CONTACT_TYPE) {
		if (pattern.test(title)) {
			return { contactType: type, contactSubtype: subtype }
		}
	}

	return { contactType: 'person', contactSubtype: 'general' }
}

// =============================================================================
// Company Classification — infer entity type/subtype from name + industry
// =============================================================================

const NAME_TO_ENTITY_TYPE: [RegExp, EntityType, string][] = [
	// investment_firm subtypes
	[/\bventure/i, 'investment_firm', 'venture_capital'],
	[/\bhedge\s+fund/i, 'investment_firm', 'hedge_fund'],
	[/\bquant/i, 'investment_firm', 'quant_fund'],
	[/\bpension/i, 'investment_firm', 'pension_fund'],
	[/\bsovereign\s+wealth/i, 'investment_firm', 'sovereign_wealth_fund'],
	[/\bendowment/i, 'investment_firm', 'endowment'],
	[/\bfund\s+of\s+funds/i, 'investment_firm', 'fund_of_funds'],
	[/\bmezzanine/i, 'investment_firm', 'mezzanine'],
	[/\bdistressed/i, 'investment_firm', 'distressed_debt'],
	[/\bprivate\s+equity/i, 'investment_firm', 'private_equity'],
	[/\bprivate\s+credit/i, 'investment_firm', 'credit_fund'],
	[/\bgrowth\s+equity/i, 'investment_firm', 'growth_equity'],
	[/\bfamily\s+office/i, 'investment_firm', 'family_office'],
	[/\breal\s+estate\s+(fund|invest)/i, 'investment_firm', 'real_estate_fund'],
	[/\binfrastructure\s+(fund|invest)/i, 'investment_firm', 'infrastructure_fund'],
	// Generic investment_firm signals
	[/\bcapital\b/i, 'investment_firm', 'private_equity'],
	[/\bpartners\b/i, 'investment_firm', 'private_equity'],
	[/\bventures\b/i, 'investment_firm', 'venture_capital'],
	[/\basset\s+management/i, 'investment_firm', 'hedge_fund'],
	[/\binvestment\s+management/i, 'investment_firm', 'hedge_fund'],
	// service_provider subtypes
	[/\blaw\s+(firm|office|group)|legal\s+(llp|partners)/i, 'service_provider', 'law_firm'],
	[/\b(deloitte|kpmg|ey\b|pwc|ernst\s*&\s*young|pricewaterhouse)/i, 'service_provider', 'accounting_firm'],
	[/\baccounting|audit/i, 'service_provider', 'accounting_firm'],
	[/\b(goldman\s+sachs|morgan\s+stanley|jp\s*morgan|citi|barclays|ubs|credit\s+suisse|lazard|evercore|moelis|rothschild)/i, 'service_provider', 'investment_bank'],
	[/\binvestment\s+bank/i, 'service_provider', 'investment_bank'],
	[/\bcorporate\s+advis/i, 'service_provider', 'corporate_advisory'],
	[/\bbroker/i, 'service_provider', 'broker_dealer'],
	[/\bconsult/i, 'service_provider', 'consulting_firm'],
	[/\btransfer\s+agent|share\s+regist/i, 'service_provider', 'transfer_agent'],
	[/\bfund\s+admin/i, 'service_provider', 'fund_administrator'],
	// mining_company subtypes
	[/\broyalt|streaming/i, 'mining_company', 'royalty_streaming'],
	[/\bexplor/i, 'mining_company', 'explorer'],
	[/\bmining|resources|minerals/i, 'mining_company', 'producer'],
	// other
	[/\bexchange\b|clearing/i, 'other', 'exchange'],
	[/\b(asx|nyse|nasdaq|lse|hkex)\b/i, 'other', 'exchange'],
]

const INDUSTRY_TO_ENTITY_TYPE: [RegExp, EntityType, string][] = [
	[/\bmining|resources|mineral|metals/i, 'mining_company', 'producer'],
	[/\boil|gas|energy/i, 'mining_company', 'producer'],
	[/\bfinancial\s+services|banking/i, 'service_provider', 'investment_bank'],
	[/\blegal/i, 'service_provider', 'law_firm'],
	[/\baccounting|audit/i, 'service_provider', 'accounting_firm'],
	[/\bconsult/i, 'service_provider', 'consulting_firm'],
	[/\btechnology|software|saas/i, 'startup', 'early_revenue'],
	[/\bventure\s+capital|private\s+equity/i, 'investment_firm', 'venture_capital'],
]

export interface CompanyClassification {
	entityType: EntityType
	entitySubtype: string
	listingStatus: ListingStatus
}

/**
 * Infer company entity type, subtype, and listing status from name + industry.
 * Returns defaults if no pattern matches.
 */
export function classifyCompany(
	name: string,
	industry?: string | null,
	tickerSymbol?: string | null,
): CompanyClassification {
	const listingStatus: ListingStatus = tickerSymbol ? 'listed' : 'unknown'

	// Check name patterns first (more specific)
	for (const [pattern, type, subtype] of NAME_TO_ENTITY_TYPE) {
		if (pattern.test(name)) {
			return { entityType: type, entitySubtype: subtype, listingStatus }
		}
	}

	// Then check industry
	if (industry) {
		for (const [pattern, type, subtype] of INDUSTRY_TO_ENTITY_TYPE) {
			if (pattern.test(industry)) {
				return { entityType: type, entitySubtype: subtype, listingStatus }
			}
		}
	}

	// If listed, default to listed_company
	if (tickerSymbol) {
		return { entityType: 'listed_company', entitySubtype: 'small_cap', listingStatus: 'listed' }
	}

	return { entityType: 'private_company', entitySubtype: 'sme', listingStatus: 'unknown' }
}
