import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { sql } from 'drizzle-orm'
import superjson from 'superjson'
import { auth } from '../lib/auth.js'
import { db } from '../lib/db.js'

/**
 * Context creation — called for every request.
 * Extracts the Better Auth session from request headers.
 */
export async function createContext(opts: FetchCreateContextFnOptions) {
	const session = await auth.api.getSession({
		headers: opts.req.headers,
	})

	return {
		db,
		/** Raw request headers for forwarding to Better Auth server API calls. */
		headers: opts.req.headers,
		session: session?.session ?? null,
		user: session?.user ?? null,
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
 * Auth middleware — rejects unauthenticated requests.
 */
const authMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		})
	}
	return next({
		ctx: {
			session: ctx.session,
			user: ctx.user,
		},
	})
})

/**
 * Tenant middleware — requires an active organization and sets RLS context.
 * Executes SET LOCAL inside the request's transaction scope.
 */
const tenantMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		})
	}

	const tenantId = ctx.session.activeOrganizationId
	if (!tenantId) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'No active organization selected. Please select an organization.',
		})
	}

	// Execute inside a transaction so SET LOCAL is scoped to this request
	return ctx.db.transaction(async (tx) => {
		await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`)

		return next({
			ctx: {
				session: ctx.session,
				user: ctx.user,
				tenantId,
				db: tx,
			},
		})
	})
})

/**
 * Admin middleware — requires admin or owner role in the active organization.
 * Sets RLS context first (needed to query the RLS-protected member table),
 * then verifies the user has admin or owner role.
 */
const adminMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		})
	}

	const tenantId = ctx.session.activeOrganizationId
	if (!tenantId) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'No active organization selected.',
		})
	}

	return ctx.db.transaction(async (tx) => {
		// Set RLS context first so we can query the member table
		await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`)

		const memberRecord = await tx.query.members.findFirst({
			where: (members, { and, eq }) =>
				and(
					eq(members.userId, ctx.user!.id),
					eq(members.organizationId, tenantId),
				),
		})

		if (!memberRecord || !['admin', 'owner'].includes(memberRecord.role)) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You must be an admin or owner to perform this action',
			})
		}

		return next({
			ctx: {
				session: ctx.session,
				user: ctx.user,
				tenantId,
				db: tx,
				memberRole: memberRecord.role,
			},
		})
	})
})

/**
 * Protected procedure — requires authenticated session.
 */
export const protectedProcedure = t.procedure.use(authMiddleware)

/**
 * Tenant procedure — requires authenticated session + active org + sets RLS.
 * Use this for all tenant-scoped CRUD operations.
 */
export const tenantProcedure = t.procedure.use(tenantMiddleware)

/**
 * Admin procedure — tenant procedure + admin/owner role check.
 * Use this for org management operations.
 */
export const adminProcedure = t.procedure.use(adminMiddleware)
