import { sql } from 'drizzle-orm'
import { jsonb, numeric, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { companies } from './companies'
import { deals } from './deals'

// =============================================================================
// Projects (Mining Assets)
// =============================================================================

export const projects = pgTable(
	'projects',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		ownerCompanyId: text('owner_company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		projectStatus: text('project_status').notNull().default('exploration'),
		// Location
		country: text('country'),
		stateProvince: text('state_province'),
		nearestTown: text('nearest_town'),
		latitude: numeric('latitude', { precision: 10, scale: 7 }),
		longitude: numeric('longitude', { precision: 10, scale: 7 }),
		// Geology
		primaryCommodity: text('primary_commodity').notNull(),
		secondaryCommodities: jsonb('secondary_commodities'),
		resourceEstimate: text('resource_estimate'),
		reserveEstimate: text('reserve_estimate'),
		reportingStandard: text('reporting_standard'),
		// Tenure
		tenureType: text('tenure_type'),
		tenureExpiry: timestamp('tenure_expiry', { withTimezone: true }),
		tenureArea: text('tenure_area'),
		// Financial
		capexEstimate: text('capex_estimate'),
		npv: text('npv'),
		irr: text('irr'),
		// General
		description: text('description'),
		stageOfStudy: text('stage_of_study'),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('projects_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Project-Deal Junction
// =============================================================================

export const projectDeals = pgTable(
	'project_deals',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		projectId: text('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		dealId: text('deal_id')
			.notNull()
			.references(() => deals.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('subject_asset'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('project_deals_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
