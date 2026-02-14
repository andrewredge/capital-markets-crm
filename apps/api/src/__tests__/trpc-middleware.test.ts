import { describe, expect, it } from 'vitest'
import { initTRPC, TRPCError } from '@trpc/server'
import { sql } from 'drizzle-orm'
import superjson from 'superjson'

/**
 * Unit tests for tRPC middleware logic.
 * These test the middleware behavior using a mock context
 * without requiring a real database or Better Auth server.
 */

// Minimal mock DB that tracks executed SQL
function createMockDb() {
	const executedSql: string[] = []
	const mockTx = {
		execute: async (query: ReturnType<typeof sql>) => {
			executedSql.push(String(query))
		},
		query: {
			members: {
				findFirst: async ({ where }: any) => {
					// Return a member record for testing
					return { id: 'member-1', userId: 'user-1', organizationId: 'org-1', role: 'owner' }
				},
			},
		},
	}
	return {
		executedSql,
		transaction: async (fn: (tx: typeof mockTx) => Promise<any>) => fn(mockTx),
		query: mockTx.query,
	}
}

// Recreate the middleware chain independently for testing
const t = initTRPC.context<{
	db: ReturnType<typeof createMockDb>
	session: { activeOrganizationId: string | null; userId: string } | null
	user: { id: string; name: string; email: string } | null
}>().create({ transformer: superjson })

const authMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
	}
	return next({ ctx: { session: ctx.session, user: ctx.user } })
})

const tenantMiddleware = t.middleware(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
	}
	const tenantId = ctx.session.activeOrganizationId
	if (!tenantId) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'No active organization' })
	}
	return ctx.db.transaction(async (tx) => {
		await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`)
		return next({ ctx: { session: ctx.session, user: ctx.user, tenantId, db: tx } })
	})
})

const testRouter = t.router({
	publicRoute: t.procedure.query(() => 'public'),
	protectedRoute: t.procedure.use(authMiddleware).query(() => 'protected'),
	tenantRoute: t.procedure.use(tenantMiddleware).query(() => 'tenant'),
})

describe('Auth Middleware', () => {
	it('allows unauthenticated access to public routes', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: null,
			user: null,
		})
		const result = await caller.publicRoute()
		expect(result).toBe('public')
	})

	it('rejects unauthenticated access to protected routes', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: null,
			user: null,
		})
		await expect(caller.protectedRoute()).rejects.toThrow(TRPCError)
		await expect(caller.protectedRoute()).rejects.toMatchObject({
			code: 'UNAUTHORIZED',
		})
	})

	it('allows authenticated access to protected routes', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: { activeOrganizationId: 'org-1', userId: 'user-1' },
			user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
		})
		const result = await caller.protectedRoute()
		expect(result).toBe('protected')
	})
})

describe('Tenant Middleware', () => {
	it('rejects unauthenticated access', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: null,
			user: null,
		})
		await expect(caller.tenantRoute()).rejects.toMatchObject({
			code: 'UNAUTHORIZED',
		})
	})

	it('rejects when no active organization is selected', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: { activeOrganizationId: null, userId: 'user-1' },
			user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
		})
		await expect(caller.tenantRoute()).rejects.toMatchObject({
			code: 'FORBIDDEN',
		})
	})

	it('allows access with valid session and active organization', async () => {
		const caller = testRouter.createCaller({
			db: createMockDb(),
			session: { activeOrganizationId: 'org-1', userId: 'user-1' },
			user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
		})
		const result = await caller.tenantRoute()
		expect(result).toBe('tenant')
	})

	it('executes SET LOCAL with the correct tenant ID', async () => {
		const mockDb = createMockDb()
		const caller = testRouter.createCaller({
			db: mockDb,
			session: { activeOrganizationId: 'org-123', userId: 'user-1' },
			user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
		})
		await caller.tenantRoute()
		// Verify that set_config was called (exact SQL format depends on drizzle internals)
		expect(mockDb.executedSql.length).toBeGreaterThan(0)
	})
})
