import { sql } from 'drizzle-orm'
import { integer, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'
import { deals } from './deals'
import { projects } from './projects'

// =============================================================================
// Documents
// =============================================================================

export const documents = pgTable(
	'documents',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		// Polymorphic owner (same pattern as activities/notes)
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
		dealId: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
		projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
		// File metadata
		fileName: text('file_name').notNull(),
		fileSize: integer('file_size').notNull(),
		mimeType: text('mime_type').notNull(),
		storageKey: text('storage_key').notNull(),
		// Classification
		documentType: text('document_type').notNull().default('other'),
		description: text('description'),
		version: integer('version').notNull().default(1),
		visibility: text('visibility').notNull().default('team'),
		// Audit
		uploadedBy: text('uploaded_by'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('documents_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
