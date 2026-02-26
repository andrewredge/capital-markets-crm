import { sql } from 'drizzle-orm'
import { boolean, pgPolicy, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// =============================================================================
// Core Better Auth Tables
// =============================================================================

/**
 * Users — Better Auth core table.
 * NOT tenant-scoped (users exist globally and belong to orgs via members).
 */
export const users = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	platformRole: text('platform_role').notNull().default('user'),
	accountStatus: text('account_status').notNull().default('active'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Sessions — Better Auth core table.
 * NOT tenant-scoped (sessions belong to users, not tenants).
 * The `activeOrganizationId` field is added by the Organization plugin.
 */
export const sessions = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	// Organization plugin: tracks user's active org for tenant context
	activeOrganizationId: text('active_organization_id'),
})

/**
 * Accounts — Better Auth core table (credential/OAuth provider links).
 * NOT tenant-scoped.
 */
export const accounts = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Verifications — Better Auth core table (email verification tokens, etc.).
 * NOT tenant-scoped.
 */
export const verifications = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// Organization Plugin Tables
// =============================================================================

/**
 * Organizations — the tenant entity.
 * NOT tenant-scoped (orgs are the tenants themselves, queried by ID).
 * The `organization.id` is what becomes `app.current_tenant` in RLS.
 */
export const organizations = pgTable(
	'organization',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		logo: text('logo'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }),
	},
	(table) => [
		uniqueIndex('organization_slug_idx').on(table.slug),
	],
)

/**
 * Members — links users to organizations with roles.
 * Tenant-scoped via RLS so members can only see their own org's members.
 */
export const members = pgTable(
	'member',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('member'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		pgPolicy('member_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

/**
 * Invitations — org invites sent to email addresses.
 * Tenant-scoped via RLS.
 */
export const invitations = pgTable(
	'invitation',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organizations.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: text('role').notNull(),
		status: text('status').notNull().default('pending'),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		inviterId: text('inviter_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
	},
	(table) => [
		pgPolicy('invitation_tenant_isolation', {
			as: 'permissive',
			for: 'all',
			using: sql`current_setting('app.current_tenant', true) = '' OR ${table.organizationId} = current_setting('app.current_tenant', true)`,
		}),
	],
)

// =============================================================================
// Platform Invitations (super-admin sends these)
// =============================================================================

/**
 * Platform invitations — sent by super-admins to allow new users onto the platform.
 * Separate from org-level invitations (Better Auth).
 */
export const platformInvitations = pgTable('platform_invitation', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
	platformRole: text('platform_role').notNull().default('user'),
	status: text('status').notNull().default('pending'),
	invitedBy: text('invited_by')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// =============================================================================
// Relations
// =============================================================================

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	members: many(members),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
	members: many(members),
	invitations: many(invitations),
}))

export const membersRelations = relations(members, ({ one }) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id],
	}),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
	organization: one(organizations, {
		fields: [invitations.organizationId],
		references: [organizations.id],
	}),
	inviter: one(users, {
		fields: [invitations.inviterId],
		references: [users.id],
	}),
}))

export const platformInvitationsRelations = relations(platformInvitations, ({ one }) => ({
	organization: one(organizations, {
		fields: [platformInvitations.organizationId],
		references: [organizations.id],
	}),
	inviter: one(users, {
		fields: [platformInvitations.invitedBy],
		references: [users.id],
	}),
}))
