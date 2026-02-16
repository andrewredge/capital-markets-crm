import { router } from './trpc.js'
import { organizationsRouter } from './routers/organizations.js'
import { contactsRouter } from './routers/contacts.js'
import { companiesRouter } from './routers/companies.js'
import { contactCompanyRolesRouter, companyRelationshipsRouter } from './routers/associations.js'
import { activitiesRouter } from './routers/activities.js'
import { notesRouter } from './routers/notes.js'
import { tagsRouter } from './routers/tags.js'

/**
 * Root application router.
 * Domain routers will be merged here as they're implemented.
 */
export const appRouter = router({
	organizations: organizationsRouter,
	contacts: contactsRouter,
	companies: companiesRouter,
	contactCompanyRoles: contactCompanyRolesRouter,
	companyRelationships: companyRelationshipsRouter,
	activities: activitiesRouter,
	notes: notesRouter,
	tags: tagsRouter,
	// Phase 4: pipelines: pipelinesRouter,
	// Phase 4: deals: dealsRouter,
})

export type AppRouter = typeof appRouter
