import { and, eq, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts, contactStaleness, contactCompanyRoles } from '@crm/db/schema'
import { STALENESS_WEIGHTS, type StalenessFlag } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'

const BATCH_SIZE = 100

/**
 * Pure function to compute staleness score and flags based on signals.
 * Deterministic, no DB I/O.
 */
export function computeStalenessScore(
	contact: {
		email?: string | null
		phone?: string | null
		title?: string | null
		linkedinUrl?: string | null
	},
	companyRoles: { id: string }[],
	lastVerifiedAt: Date | null | undefined,
	now: Date = new Date(),
) {
	const flags: StalenessFlag[] = []
	let score = 0

	// Missing data signals
	if (!contact.email) {
		flags.push('no_email')
		score += STALENESS_WEIGHTS.no_email
	}
	if (!contact.phone) {
		flags.push('no_phone')
		score += STALENESS_WEIGHTS.no_phone
	}
	if (!contact.title || contact.title.trim() === '') {
		flags.push('title_empty')
		score += STALENESS_WEIGHTS.title_empty
	}
	if (companyRoles.length === 0) {
		flags.push('no_company_role')
		score += STALENESS_WEIGHTS.no_company_role
	}
	if (!contact.linkedinUrl) {
		flags.push('linkedin_missing')
		score += STALENESS_WEIGHTS.linkedin_missing
	}

	// Verification age signals — never-verified contacts get the maximum penalty
	if (!lastVerifiedAt) {
		flags.push('not_verified_365d')
		score += STALENESS_WEIGHTS.not_verified_365d
	} else {
		const daysSinceVerified = (now.getTime() - lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
		if (daysSinceVerified >= 365) {
			flags.push('not_verified_365d')
			score += STALENESS_WEIGHTS.not_verified_365d
		} else if (daysSinceVerified >= 180) {
			flags.push('not_verified_180d')
			score += STALENESS_WEIGHTS.not_verified_180d
		} else if (daysSinceVerified >= 90) {
			flags.push('not_verified_90d')
			score += STALENESS_WEIGHTS.not_verified_90d
		}
	}

	return {
		score: Math.min(1.0, score),
		flags,
	}
}

/**
 * Recomputes and updates staleness record for a single contact.
 */
export async function upsertStaleness(db: DrizzleDB, tenantId: string, contactId: string) {
	// Fetch contact, roles, and existing staleness record
	const contact = await db.query.contacts.findFirst({
		where: and(eq(contacts.id, contactId), eq(contacts.organizationId, tenantId)),
	})
	if (!contact) return

	const roles = await db.query.contactCompanyRoles.findMany({
		where: eq(contactCompanyRoles.contactId, contactId),
	})

	const existing = await db.query.contactStaleness.findFirst({
		where: eq(contactStaleness.contactId, contactId),
	})

	const { score, flags } = computeStalenessScore(contact, roles, existing?.lastVerifiedAt)

	if (existing) {
		await db
			.update(contactStaleness)
			.set({
				stalenessScore: score,
				stalenessFlags: flags,
				updatedAt: new Date(),
			})
			.where(eq(contactStaleness.id, existing.id))
	} else {
		await db.insert(contactStaleness).values({
			id: nanoid(),
			organizationId: tenantId,
			contactId,
			stalenessScore: score,
			stalenessFlags: flags,
		})
	}
}

/**
 * Recomputes and updates staleness records for multiple contacts.
 */
export async function bulkUpsertStaleness(db: DrizzleDB, tenantId: string, contactIds: string[]) {
	if (contactIds.length === 0) return

	for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
		const batchIds = contactIds.slice(i, i + BATCH_SIZE)

		// Fetch all data for this batch (defense-in-depth: filter by tenantId alongside RLS)
		const contactsData = await db.query.contacts.findMany({
			where: and(inArray(contacts.id, batchIds), eq(contacts.organizationId, tenantId)),
		})
		const rolesData = await db.query.contactCompanyRoles.findMany({
			where: and(inArray(contactCompanyRoles.contactId, batchIds), eq(contactCompanyRoles.organizationId, tenantId)),
		})
		const stalenessData = await db.query.contactStaleness.findMany({
			where: and(inArray(contactStaleness.contactId, batchIds), eq(contactStaleness.organizationId, tenantId)),
		})

		const rolesByContact = new Map<string, typeof rolesData>()
		for (const role of rolesData) {
			const arr = rolesByContact.get(role.contactId) || []
			arr.push(role)
			rolesByContact.set(role.contactId, arr)
		}

		const stalenessByContact = new Map<string, typeof stalenessData[0]>()
		for (const s of stalenessData) {
			stalenessByContact.set(s.contactId, s)
		}

		// Prepare inserts and updates
		const toInsert: (typeof contactStaleness.$inferInsert)[] = []
		const toUpdate: { id: string; score: number; flags: string[] }[] = []

		for (const contact of contactsData) {
			const roles = rolesByContact.get(contact.id) || []
			const existing = stalenessByContact.get(contact.id)
			const { score, flags } = computeStalenessScore(contact, roles, existing?.lastVerifiedAt)

			if (existing) {
				toUpdate.push({ id: existing.id, score, flags })
			} else {
				toInsert.push({
					id: nanoid(),
					organizationId: tenantId,
					contactId: contact.id,
					stalenessScore: score,
					stalenessFlags: flags,
				})
			}
		}

		// Execute inserts
		if (toInsert.length > 0) {
			await db.insert(contactStaleness).values(toInsert)
		}

		// Execute updates (individual for now, or use a complex SQL if needed)
		for (const upd of toUpdate) {
			await db
				.update(contactStaleness)
				.set({
					stalenessScore: upd.score,
					stalenessFlags: upd.flags,
					updatedAt: new Date(),
				})
				.where(eq(contactStaleness.id, upd.id))
		}
	}
}
