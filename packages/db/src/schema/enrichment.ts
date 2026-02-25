import { sql } from 'drizzle-orm'
import { index, jsonb, pgPolicy, pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { contacts } from './contacts'

// =============================================================================
// Contact Staleness
// =============================================================================

/**
 * 1:1 extension table for contacts — tracks data freshness and verification.
 * Staleness score (0.0–1.0) computed from structural signals.
 * Contacts scoring >= 0.4 appear in the review queue.
 *
 * NOTE: FORCE ROW LEVEL SECURITY is applied manually in the migration
 * (Drizzle-kit only generates ENABLE, not FORCE — see 0001_force_rls.sql pattern)
 */
export const contactStaleness = pgTable(
	'contact_staleness',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		contactId: text('contact_id')
			.notNull()
			.references(() => contacts.id, { onDelete: 'cascade' }),

		// Staleness scoring
		stalenessScore: real('staleness_score').notNull().default(0),
		stalenessFlags: jsonb('staleness_flags').notNull().default([]),

		// Verification tracking
		lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
		lastVerifiedBy: text('last_verified_by'), // 'import' | 'manual' | userId

		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('contact_staleness_contact_id_unique').on(table.contactId),
		pgPolicy('contact_staleness_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Enrichment Proposals
// =============================================================================

/**
 * Append-only audit trail for proposed contact data changes.
 * Each row = one review action (manual edit, import conflict, future: LLM).
 * proposedChanges is a JSON diff keyed by field name.
 *
 * NOTE: FORCE ROW LEVEL SECURITY is applied manually in the migration
 * (Drizzle-kit only generates ENABLE, not FORCE — see 0001_force_rls.sql pattern)
 */
export const enrichmentProposals = pgTable(
	'enrichment_proposals',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		contactId: text('contact_id')
			.notNull()
			.references(() => contacts.id, { onDelete: 'cascade' }),

		// Source of this proposal
		source: text('source').notNull(), // 'manual' | 'import_conflict' | future: 'llm_claude'

		// Proposed field changes
		proposedChanges: jsonb('proposed_changes').notNull(),

		// Review state
		reviewStatus: text('review_status').notNull().default('pending'),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
		reviewedBy: text('reviewed_by'), // userId
		acceptedFields: jsonb('accepted_fields').notNull().default([]),

		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('enrichment_proposals_contact_id_idx').on(table.contactId),
		index('enrichment_proposals_org_status_idx').on(table.organizationId, table.reviewStatus),
		pgPolicy('enrichment_proposals_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)
