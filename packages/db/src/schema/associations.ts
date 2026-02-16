import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { boolean, pgPolicy, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'
import { companies } from './companies'
import { activities } from './activities'
import { notes } from './notes'
import { tags, taggings } from './tags'
import { pipelines, pipelineStages } from './pipelines'
import { deals, dealParticipants, dealStageHistory } from './deals'

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
	dealParticipants: many(dealParticipants),
	activities: many(activities),
	notes: many(notes),
	taggings: many(taggings),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [companies.organizationId],
		references: [organizations.id],
	}),
	contactCompanyRoles: many(contactCompanyRoles),
	dealParticipants: many(dealParticipants),
	companyRelationshipsFrom: many(companyRelationships, { relationName: 'fromCompany' }),
	companyRelationshipsTo: many(companyRelationships, { relationName: 'toCompany' }),
	activities: many(activities),
	notes: many(notes),
	taggings: many(taggings),
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

// =============================================================================
// Phase 3 Relations
// =============================================================================

export const activitiesRelations = relations(activities, ({ one }) => ({
	organization: one(organizations, {
		fields: [activities.organizationId],
		references: [organizations.id],
	}),
	contact: one(contacts, {
		fields: [activities.contactId],
		references: [contacts.id],
	}),
	company: one(companies, {
		fields: [activities.companyId],
		references: [companies.id],
	}),
	deal: one(deals, {
		fields: [activities.dealId],
		references: [deals.id],
	}),
}))

export const notesRelations = relations(notes, ({ one }) => ({
	organization: one(organizations, {
		fields: [notes.organizationId],
		references: [organizations.id],
	}),
	contact: one(contacts, {
		fields: [notes.contactId],
		references: [contacts.id],
	}),
	company: one(companies, {
		fields: [notes.companyId],
		references: [companies.id],
	}),
	deal: one(deals, {
		fields: [notes.dealId],
		references: [deals.id],
	}),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [tags.organizationId],
		references: [organizations.id],
	}),
	taggings: many(taggings),
}))

export const taggingsRelations = relations(taggings, ({ one }) => ({
	organization: one(organizations, {
		fields: [taggings.organizationId],
		references: [organizations.id],
	}),
	tag: one(tags, {
		fields: [taggings.tagId],
		references: [tags.id],
	}),
	contact: one(contacts, {
		fields: [taggings.contactId],
		references: [contacts.id],
	}),
	company: one(companies, {
		fields: [taggings.companyId],
		references: [companies.id],
	}),
	deal: one(deals, {
		fields: [taggings.dealId],
		references: [deals.id],
	}),
}))

// =============================================================================
// Phase 4 Relations
// =============================================================================

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [pipelines.organizationId],
		references: [organizations.id],
	}),
	stages: many(pipelineStages),
	deals: many(deals),
}))

export const pipelineStagesRelations = relations(pipelineStages, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [pipelineStages.organizationId],
		references: [organizations.id],
	}),
	pipeline: one(pipelines, {
		fields: [pipelineStages.pipelineId],
		references: [pipelines.id],
	}),
	deals: many(deals),
	historyTo: many(dealStageHistory, { relationName: 'toStage' }),
	historyFrom: many(dealStageHistory, { relationName: 'fromStage' }),
}))

export const dealsRelations = relations(deals, ({ one, many }) => ({
	organization: one(organizations, {
		fields: [deals.organizationId],
		references: [organizations.id],
	}),
	pipeline: one(pipelines, {
		fields: [deals.pipelineId],
		references: [pipelines.id],
	}),
	currentStage: one(pipelineStages, {
		fields: [deals.currentStageId],
		references: [pipelineStages.id],
	}),
	participants: many(dealParticipants),
	stageHistory: many(dealStageHistory),
	activities: many(activities),
	notes: many(notes),
	taggings: many(taggings),
}))

export const dealParticipantsRelations = relations(dealParticipants, ({ one }) => ({
	organization: one(organizations, {
		fields: [dealParticipants.organizationId],
		references: [organizations.id],
	}),
	deal: one(deals, {
		fields: [dealParticipants.dealId],
		references: [deals.id],
	}),
	contact: one(contacts, {
		fields: [dealParticipants.contactId],
		references: [contacts.id],
	}),
	company: one(companies, {
		fields: [dealParticipants.companyId],
		references: [companies.id],
	}),
}))

export const dealStageHistoryRelations = relations(dealStageHistory, ({ one }) => ({
	organization: one(organizations, {
		fields: [dealStageHistory.organizationId],
		references: [organizations.id],
	}),
	deal: one(deals, {
		fields: [dealStageHistory.dealId],
		references: [deals.id],
	}),
	fromStage: one(pipelineStages, {
		fields: [dealStageHistory.fromStageId],
		references: [pipelineStages.id],
		relationName: 'fromStage',
	}),
	toStage: one(pipelineStages, {
		fields: [dealStageHistory.toStageId],
		references: [pipelineStages.id],
		relationName: 'toStage',
	}),
}))
