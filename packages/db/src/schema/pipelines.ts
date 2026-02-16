import { sql } from 'drizzle-orm'
import { boolean, integer, pgPolicy, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { organizations } from './auth'

// =============================================================================
// Pipelines
// =============================================================================

export const pipelines = pgTable(
	'pipelines',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		isDefault: boolean('is_default').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		unique('pipelines_org_name_unique').on(table.organizationId, table.name),
		pgPolicy('pipelines_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Pipeline Stages
// =============================================================================

export const pipelineStages = pgTable(
	'pipeline_stages',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		pipelineId: text('pipeline_id')
			.notNull()
			.references(() => pipelines.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		position: integer('position').notNull(),
		color: text('color').notNull().default('#3B82F6'),
		isTerminal: boolean('is_terminal').notNull().default(false),
		terminalType: text('terminal_type'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('pipeline_stages_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
