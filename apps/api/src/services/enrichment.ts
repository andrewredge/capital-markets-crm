import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { contacts, contactStaleness, enrichmentProposals } from '@crm/db/schema'
import { ENRICHABLE_CONTACT_FIELDS, STALENESS_THRESHOLD, type StalenessQueueFilterInput, type ReviewProposalInput, type StalenessFlag } from '@crm/shared'
import type { DrizzleDB } from '../lib/types.js'
import { computeStalenessScore, upsertStaleness } from './staleness.js'

/**
 * Fetches the staleness review queue with pagination and search.
 */
export async function getStalenessQueue(db: DrizzleDB, tenantId: string, filter: StalenessQueueFilterInput) {
	const offset = (filter.page - 1) * filter.limit

	const whereClause = and(
		eq(contactStaleness.organizationId, tenantId),
		gte(contactStaleness.stalenessScore, filter.minScore ?? STALENESS_THRESHOLD),
		filter.search
			? or(
					ilike(contacts.firstName, `%${filter.search}%`),
					ilike(contacts.lastName, `%${filter.search}%`),
					ilike(contacts.title, `%${filter.search}%`),
			  )
			: undefined,
	)

	const results = await db
		.select({
			id: contactStaleness.id,
			contactId: contactStaleness.contactId,
			firstName: contacts.firstName,
			lastName: contacts.lastName,
			title: contacts.title,
			score: contactStaleness.stalenessScore,
			flags: sql<StalenessFlag[]>`${contactStaleness.stalenessFlags}`,
			lastVerifiedAt: contactStaleness.lastVerifiedAt,
		})
		.from(contactStaleness)
		.innerJoin(contacts, eq(contactStaleness.contactId, contacts.id))
		.where(whereClause)
		.orderBy(desc(contactStaleness.stalenessScore))
		.limit(filter.limit)
		.offset(offset)

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(contactStaleness)
		.innerJoin(contacts, eq(contactStaleness.contactId, contacts.id))
		.where(whereClause)

	return {
		items: results,
		total: Number(countResult[0]?.count ?? 0),
	}
}

/**
 * Fetches enrichment proposals for a specific contact.
 */
export async function getProposalsByContact(db: DrizzleDB, tenantId: string, contactId: string) {
	return await db.query.enrichmentProposals.findMany({
		where: and(
			eq(enrichmentProposals.organizationId, tenantId),
			eq(enrichmentProposals.contactId, contactId),
		),
		orderBy: desc(enrichmentProposals.createdAt),
	})
}

/**
 * Reviews a proposal (accept, reject, or partial) and applies changes.
 */
export async function reviewProposal(
	db: DrizzleDB,
	tenantId: string,
	input: ReviewProposalInput,
	reviewerId: string,
) {
	const proposal = await db.query.enrichmentProposals.findFirst({
		where: and(
			eq(enrichmentProposals.id, input.proposalId),
			eq(enrichmentProposals.organizationId, tenantId),
		),
	})
	if (!proposal) throw new Error('Proposal not found')

	const status = input.action === 'accept' ? 'accepted' : input.action === 'reject' ? 'rejected' : 'partially_accepted'
	const acceptedFields = input.acceptedFields || []

	// Update proposal
	await db
		.update(enrichmentProposals)
		.set({
			reviewStatus: status,
			reviewedAt: new Date(),
			reviewedBy: reviewerId,
			acceptedFields: acceptedFields,
			updatedAt: new Date(),
		})
		.where(eq(enrichmentProposals.id, proposal.id))

	// Apply changes to contact
	if (status !== 'rejected' && acceptedFields.length > 0) {
		const changes: Record<string, any> = {}
		const proposedChanges = proposal.proposedChanges as Record<string, any>
		const allowedFields = new Set<string>(ENRICHABLE_CONTACT_FIELDS)

		for (const field of acceptedFields) {
			if (allowedFields.has(field) && proposedChanges[field]) {
				changes[field] = proposedChanges[field].proposed
			}
		}

		if (Object.keys(changes).length > 0) {
			await db
				.update(contacts)
				.set({ ...changes, updatedAt: new Date() })
				.where(eq(contacts.id, proposal.contactId))

			// Recompute staleness after applying changes
			await upsertStaleness(db, tenantId, proposal.contactId)
		}
	}
}

/**
 * Marks a contact as verified, resetting its verification-related staleness signals.
 */
export async function markVerified(db: DrizzleDB, tenantId: string, contactId: string, verifiedBy: string = 'manual') {
	// First ensure staleness record exists (or update it)
	const existing = await db.query.contactStaleness.findFirst({
		where: and(
			eq(contactStaleness.contactId, contactId),
			eq(contactStaleness.organizationId, tenantId),
		),
	})

	if (existing) {
		await db
			.update(contactStaleness)
			.set({
				lastVerifiedAt: new Date(),
				lastVerifiedBy: verifiedBy,
				updatedAt: new Date(),
			})
			.where(eq(contactStaleness.id, existing.id))
	} else {
		// No staleness record yet — create one with verification already set
		const contact = await db.query.contacts.findFirst({
			where: and(eq(contacts.id, contactId), eq(contacts.organizationId, tenantId)),
		})
		if (!contact) return

		const { score, flags } = computeStalenessScore(contact, [], new Date())
		await db.insert(contactStaleness).values({
			id: nanoid(),
			organizationId: tenantId,
			contactId,
			stalenessScore: score,
			stalenessFlags: flags,
			lastVerifiedAt: new Date(),
			lastVerifiedBy: verifiedBy,
		})
		return
	}

	// Recompute score (this will use the new lastVerifiedAt)
	await upsertStaleness(db, tenantId, contactId)
}

/**
 * Fetches summary statistics for the enrichment dashboard.
 */
export async function getEnrichmentStats(db: DrizzleDB, tenantId: string) {
	const now = new Date()
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

	const [totalContacts] = await db
		.select({ count: sql<number>`count(*)` })
		.from(contacts)
		.where(eq(contacts.organizationId, tenantId))

	const [flaggedContacts] = await db
		.select({ count: sql<number>`count(*)` })
		.from(contactStaleness)
		.where(
			and(
				eq(contactStaleness.organizationId, tenantId),
				gte(contactStaleness.stalenessScore, 0.4),
			),
		)

	const [pendingProposals] = await db
		.select({ count: sql<number>`count(*)` })
		.from(enrichmentProposals)
		.where(
			and(
				eq(enrichmentProposals.organizationId, tenantId),
				eq(enrichmentProposals.reviewStatus, 'pending'),
			),
		)

	const [verifiedThisMonth] = await db
		.select({ count: sql<number>`count(*)` })
		.from(contactStaleness)
		.where(
			and(
				eq(contactStaleness.organizationId, tenantId),
				gte(contactStaleness.lastVerifiedAt, startOfMonth),
			),
		)

	return {
		totalContacts: Number(totalContacts?.count ?? 0),
		flaggedContacts: Number(flaggedContacts?.count ?? 0),
		pendingProposals: Number(pendingProposals?.count ?? 0),
		verifiedThisMonth: Number(verifiedThisMonth?.count ?? 0),
	}
}
