import { sql } from 'drizzle-orm'
import { pgPolicy, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'

// =============================================================================
// Tags
// =============================================================================

export const tags = pgTable(
	'tags',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		color: text('color'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		unique('tags_org_name_unique').on(table.organizationId, table.name),
		pgPolicy('tags_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Taggings (junction)
// =============================================================================

export const taggings = pgTable(
	'taggings',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
		dealId: text('deal_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('taggings_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
