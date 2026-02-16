import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { boolean, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'

// =============================================================================
// Contact–Company Roles (junction)
// =============================================================================

export const contactCompanyRoles = pgTable(
	'contact_company_roles',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		contactId: text('contact_id')
			.notNull()
			.references(() => contacts.id, { onDelete: 'cascade' }),
		companyId: text('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		role: text('role').notNull(),
		isPrimary: boolean('is_primary').notNull().default(false),
		startDate: timestamp('start_date', { withTimezone: true }),
		endDate: timestamp('end_date', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('contact_company_roles_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Company Relationships (junction)
// =============================================================================

export const companyRelationships = pgTable(
	'company_relationships',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		fromCompanyId: text('from_company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		toCompanyId: text('to_company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		relationshipType: text('relationship_type').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('company_relationships_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Relations (all cross-file relations defined here to avoid circular imports)
// =============================================================================

export const contactsRelations = relations(contacts, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [contacts.organizationId],
		references: [organizations.id],
	}),
	contactCompanyRoles: many(contactCompanyRoles),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [companies.organizationId],
		references: [organizations.id],
	}),
	contactCompanyRoles: many(contactCompanyRoles),
	companyRelationshipsFrom: many(companyRelationships, { relationName: 'fromCompany' }),
	companyRelationshipsTo: many(companyRelationships, { relationName: 'toCompany' }),
}))

export const contactCompanyRolesRelations = relations(contactCompanyRoles, ({ one }) => ({
	organization: one(organizations, {
		fields: [contactCompanyRoles.organizationId],
		references: [organizations.id],
	}),
	contact: one(contacts, {
		fields: [contactCompanyRoles.contactId],
		references: [contacts.id],
	}),
	company: one(companies, {
		fields: [contactCompanyRoles.companyId],
		references: [companies.id],
	}),
}))

export const companyRelationshipsRelations = relations(companyRelationships, ({ one }) => ({
	organization: one(organizations, {
		fields: [companyRelationships.organizationId],
		references: [organizations.id],
	}),
	fromCompany: one(companies, {
		fields: [companyRelationships.fromCompanyId],
		references: [companies.id],
		relationName: 'fromCompany',
	}),
	toCompany: one(companies, {
		fields: [companyRelationships.toCompanyId],
		references: [companies.id],
		relationName: 'toCompany',
	}),
}))
