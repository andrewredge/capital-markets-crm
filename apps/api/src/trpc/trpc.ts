import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { eq, sql } from 'drizzle-orm'
import superjson from 'superjson'
import { auth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import * as schema from '@crm/db/schema'

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
 * Account status middleware — blocks suspended/pending accounts from API access.
 * Must be used after authMiddleware.
 */
const accountStatusMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' })
	}

	// Look up the user's current account status from DB
	const [dbUser] = await ctx.db
		.select({ accountStatus: schema.users.accountStatus })
		.from(schema.users)
		.where(eq(schema.users.id, ctx.user.id))
		.limit(1)

	if (!dbUser || dbUser.accountStatus !== 'active') {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Your account is not active. Please contact an administrator.',
		})
	}

	return next({ ctx })
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
 * Super-admin middleware — requires platformRole === 'super_admin'.
 * Does NOT set RLS context (super-admin operates across all tenants).
 */
const superAdminMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'You must be logged in to access this resource',
		})
	}

	const [dbUser] = await ctx.db
		.select({ platformRole: schema.users.platformRole })
		.from(schema.users)
		.where(eq(schema.users.id, ctx.user.id))
		.limit(1)

	if (!dbUser || dbUser.platformRole !== 'super_admin') {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Super-admin access required',
		})
	}

	return next({
		ctx: {
			session: ctx.session,
			user: ctx.user,
			db: ctx.db,
		},
	})
})

/**
 * Protected procedure — requires authenticated session.
 */
export const protectedProcedure = t.procedure.use(authMiddleware)

/**
 * Tenant procedure — requires authenticated session + active org + sets RLS.
 * Also checks account status is active.
 * Use this for all tenant-scoped CRUD operations.
 */
export const tenantProcedure = t.procedure.use(authMiddleware).use(accountStatusMiddleware).use(tenantMiddleware)

/**
 * Admin procedure — tenant procedure + admin/owner role check.
 * Use this for org management operations.
 */
export const adminProcedure = t.procedure.use(authMiddleware).use(accountStatusMiddleware).use(adminMiddleware)

/**
 * Super-admin procedure — requires super_admin platform role.
 * Use this for platform-wide management (user admin, invitations).
 */
export const superAdminProcedure = t.procedure.use(superAdminMiddleware)
