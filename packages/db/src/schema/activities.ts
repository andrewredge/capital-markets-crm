import { sql } from 'drizzle-orm'
import { integer, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'
import { projects } from './projects'

// =============================================================================
// Activities
// =============================================================================

export const activities = pgTable(
	'activities',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
		dealId: text('deal_id'),
		projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
		activityType: text('activity_type').notNull(),
		subject: text('subject'),
		description: text('description'),
		occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
		duration: integer('duration'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('activities_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
