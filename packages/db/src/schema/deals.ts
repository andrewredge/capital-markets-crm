import { sql } from 'drizzle-orm'
import { boolean, check, integer, numeric, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'
import { pipelines, pipelineStages } from './pipelines'

// =============================================================================
// Deals
// =============================================================================

export const deals = pgTable(
	'deals',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		pipelineId: text('pipeline_id')
			.notNull()
			.references(() => pipelines.id, { onDelete: 'restrict' }),
		currentStageId: text('current_stage_id')
			.notNull()
			.references(() => pipelineStages.id, { onDelete: 'restrict' }),
		name: text('name').notNull(),
		dealType: text('deal_type').notNull(),
		amount: numeric('amount', { precision: 15, scale: 2 }),
		currency: text('currency').notNull().default('USD'),
		expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
		confidence: integer('confidence'),
		description: text('description'),
		ownerId: text('owner_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('deals_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Deal Participants
// =============================================================================

export const dealParticipants = pgTable(
	'deal_participants',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		dealId: text('deal_id')
			.notNull()
			.references(() => deals.id, { onDelete: 'cascade' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
		role: text('role').notNull(),
		isPrimary: boolean('is_primary').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		check('deal_participants_entity_check', sql`${table.contactId} IS NOT NULL OR ${table.companyId} IS NOT NULL`),
		pgPolicy('deal_participants_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Deal Stage History
// =============================================================================

export const dealStageHistory = pgTable(
	'deal_stage_history',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		dealId: text('deal_id')
			.notNull()
			.references(() => deals.id, { onDelete: 'cascade' }),
		fromStageId: text('from_stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
		toStageId: text('to_stage_id')
			.notNull()
			.references(() => pipelineStages.id, { onDelete: 'cascade' }),
		movedAt: timestamp('moved_at', { withTimezone: true }).notNull().defaultNow(),
		movedBy: text('moved_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('deal_stage_history_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
