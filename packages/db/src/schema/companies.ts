import { sql } from 'drizzle-orm'
import { integer, jsonb, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'

// =============================================================================
// Companies
// =============================================================================

export const companies = pgTable(
	'companies',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		entityType: text('entity_type').notNull(),
		// Common fields
		website: text('website'),
		industry: text('industry'),
		headquarters: text('headquarters'),
		foundedYear: integer('founded_year'),
		employeeCountRange: text('employee_count_range'),
		// Investor-specific
		investorType: text('investor_type'),
		aum: text('aum'),
		investmentStageFocus: jsonb('investment_stage_focus'),
		// Listed company-specific
		tickerSymbol: text('ticker_symbol'),
		exchange: text('exchange'),
		marketCap: text('market_cap'),
		// Startup-specific
		fundingStage: text('funding_stage'),
		totalFunding: text('total_funding'),
		// General
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('companies_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
