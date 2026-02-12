import { router } from './trpc.js'

/**
 * Root application router.
 * Domain routers will be merged here as they're implemented.
 */
export const appRouter = router({
	// Phase 2: contacts: contactsRouter,
	// Phase 2: companies: companiesRouter,
	// Phase 3: activities: activitiesRouter,
	// Phase 3: notes: notesRouter,
	// Phase 3: tags: tagsRouter,
	// Phase 4: pipelines: pipelinesRouter,
	// Phase 4: deals: dealsRouter,
})

export type AppRouter = typeof appRouter
