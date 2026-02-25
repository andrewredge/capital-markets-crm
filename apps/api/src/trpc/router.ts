import { router } from './trpc.js'
import { organizationsRouter } from './routers/organizations.js'
import { contactsRouter } from './routers/contacts.js'
import { companiesRouter } from './routers/companies.js'
import { contactCompanyRolesRouter, companyRelationshipsRouter } from './routers/associations.js'
import { activitiesRouter } from './routers/activities.js'
import { notesRouter } from './routers/notes.js'
import { tagsRouter } from './routers/tags.js'
import { pipelinesRouter } from './routers/pipelines.js'
import { dealsRouter } from './routers/deals.js'
import { contactImportRouter } from './routers/contact-import.js'
import { companyImportRouter } from './routers/company-import.js'
import { linkedImportRouter } from './routers/linked-import.js'
import { enrichmentRouter } from './routers/enrichment.js'

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
	pipelines: pipelinesRouter,
	deals: dealsRouter,
	contactImport: contactImportRouter,
	companyImport: companyImportRouter,
	linkedImport: linkedImportRouter,
	enrichment: enrichmentRouter,
})

export type AppRouter = typeof appRouter
