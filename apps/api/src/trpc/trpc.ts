import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import superjson from 'superjson'

/**
 * Context creation — called for every request.
 * Phase 1 will add: session, user, tenant (org) from Better Auth
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
	return {
		req: opts.req,
		// Phase 1: session, user, tenantId will be added here
	}
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape
	},
})

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware

/**
 * Protected procedure — requires authenticated session.
 * Phase 1 will implement the auth check middleware.
 */
export const protectedProcedure = t.procedure
// Phase 1: .use(authMiddleware)
// Phase 1: .use(tenantMiddleware)  — sets RLS context
