import { z } from 'zod'
import { tenantProcedure, router } from '../trpc.js'
import {
	getStalenessQueue,
	getProposalsByContact,
	reviewProposal,
	markVerified,
	getEnrichmentStats,
} from '../../services/enrichment.js'
import {
	stalenessQueueFilterSchema,
	reviewProposalSchema,
	markVerifiedSchema,
} from '@crm/shared'

/**
 * Enrichment router — handles staleness review queue and enrichment proposals.
 * All procedures are tenant-scoped via tenantProcedure (RLS).
 */
export const enrichmentRouter = router({
	/**
	 * Get contacts flagged for review (score >= 0.4)
	 */
	getStalenessQueue: tenantProcedure
		.input(stalenessQueueFilterSchema)
		.query(async ({ ctx, input }) => {
			return await getStalenessQueue(ctx.db, ctx.tenantId, input)
		}),

	/**
	 * Get proposals for a specific contact
	 */
	getProposalsByContact: tenantProcedure
		.input(z.object({ contactId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await getProposalsByContact(ctx.db, ctx.tenantId, input.contactId)
		}),

	/**
	 * Accept, reject, or partially accept an enrichment proposal
	 */
	reviewProposal: tenantProcedure
		.input(reviewProposalSchema)
		.mutation(async ({ ctx, input }) => {
			return await reviewProposal(ctx.db, ctx.tenantId, input, ctx.user!.id)
		}),

	/**
	 * Manually mark a contact as verified (resets aging signals)
	 */
	markVerified: tenantProcedure
		.input(markVerifiedSchema)
		.mutation(async ({ ctx, input }) => {
			return await markVerified(ctx.db, ctx.tenantId, input.contactId, ctx.user!.id)
		}),

	/**
	 * Get summary statistics for the enrichment dashboard
	 */
	getStats: tenantProcedure.query(async ({ ctx }) => {
		return await getEnrichmentStats(ctx.db, ctx.tenantId)
	}),
})
