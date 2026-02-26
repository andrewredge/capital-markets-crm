import { and, count, eq, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { users, platformInvitations, organizations, members } from '@crm/db/schema'
import type {
	PlatformUserFilterInput,
	PlatformInvitationFilterInput,
	SendPlatformInviteInput,
} from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

export async function listUsers(db: DrizzleDB, filters: PlatformUserFilterInput) {
	const { search, accountStatus, platformRole, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = []

	if (accountStatus) {
		conditions.push(eq(users.accountStatus, accountStatus))
	}

	if (platformRole) {
		conditions.push(eq(users.platformRole, platformRole))
	}

	if (search) {
		const pattern = `%${search}%`
		conditions.push(
			or(
				ilike(users.name, pattern),
				ilike(users.email, pattern),
			)!,
		)
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, totalResult] = await Promise.all([
		db.select().from(users).where(where).orderBy(users.createdAt).limit(limit).offset(offset),
		db.select({ total: count() }).from(users).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getUserById(db: DrizzleDB, userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})
	return user ?? null
}

export async function updateAccountStatus(db: DrizzleDB, userId: string, accountStatus: string) {
	const [updated] = await db
		.update(users)
		.set({ accountStatus, updatedAt: new Date() })
		.where(eq(users.id, userId))
		.returning()

	if (!updated) throw new Error('User not found')
	return updated
}

export async function updatePlatformRole(db: DrizzleDB, userId: string, platformRole: string) {
	const [updated] = await db
		.update(users)
		.set({ platformRole, updatedAt: new Date() })
		.where(eq(users.id, userId))
		.returning()

	if (!updated) throw new Error('User not found')
	return updated
}

export async function createInvitation(db: DrizzleDB, invitedBy: string, input: SendPlatformInviteInput) {
	const token = nanoid(32)
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

	// Check if email already has an active user
	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, input.email),
	})
	if (existingUser) {
		throw new Error('A user with this email already exists')
	}

	// Check if there's already a pending invitation for this email
	const existingInvite = await db.query.platformInvitations.findFirst({
		where: and(
			eq(platformInvitations.email, input.email),
			eq(platformInvitations.status, 'pending'),
		),
	})
	if (existingInvite) {
		throw new Error('A pending invitation already exists for this email')
	}

	const [invitation] = await db
		.insert(platformInvitations)
		.values({
			id: nanoid(),
			email: input.email,
			token,
			organizationId: input.organizationId ?? null,
			platformRole: input.platformRole,
			invitedBy,
			expiresAt,
		})
		.returning()

	return invitation
}

export async function listInvitations(db: DrizzleDB, filters: PlatformInvitationFilterInput) {
	const { status, page, limit } = filters
	const offset = (page - 1) * limit

	const conditions = []
	if (status) {
		conditions.push(eq(platformInvitations.status, status))
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const [items, totalResult] = await Promise.all([
		db.select().from(platformInvitations).where(where).orderBy(platformInvitations.createdAt).limit(limit).offset(offset),
		db.select({ total: count() }).from(platformInvitations).where(where),
	])

	return { items, total: totalResult[0]?.total ?? 0, page, limit }
}

export async function getInvitationByToken(db: DrizzleDB, token: string) {
	const invitation = await db.query.platformInvitations.findFirst({
		where: and(
			eq(platformInvitations.token, token),
			eq(platformInvitations.status, 'pending'),
		),
	})

	if (!invitation) return null

	// Check expiry
	if (new Date() > invitation.expiresAt) {
		await db
			.update(platformInvitations)
			.set({ status: 'expired' })
			.where(eq(platformInvitations.id, invitation.id))
		return null
	}

	return invitation
}

export async function markInvitationAccepted(db: DrizzleDB, invitationId: string) {
	await db
		.update(platformInvitations)
		.set({ status: 'accepted' })
		.where(eq(platformInvitations.id, invitationId))
}

export async function revokeInvitation(db: DrizzleDB, invitationId: string) {
	const [updated] = await db
		.update(platformInvitations)
		.set({ status: 'revoked' })
		.where(eq(platformInvitations.id, invitationId))
		.returning()

	if (!updated) throw new Error('Invitation not found')
	return updated
}

export async function listOrganizations(db: DrizzleDB) {
	return db.select().from(organizations).orderBy(organizations.name)
}
