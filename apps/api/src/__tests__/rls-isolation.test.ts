import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@crm/db/schema'

/**
 * RLS Integration Tests
 * Tests PostgreSQL Row-Level Security tenant isolation against a real database.
 * Requires Docker PostgreSQL to be running.
 *
 * These tests:
 * 1. Create two organizations
 * 2. Insert members in each org (with RLS context set)
 * 3. Verify that setting app.current_tenant isolates data correctly
 */

// Superuser for setup/teardown (bypasses RLS)
const ADMIN_DB_URL = process.env.DATABASE_URL || 'postgresql://crm:crm_dev_password@localhost:5432/crm_dev'
// Non-superuser for RLS tests (respects RLS policies)
const APP_DB_URL = process.env.APP_DATABASE_URL || 'postgresql://crm_app:crm_app_password@localhost:5432/crm_dev'

let adminClient: ReturnType<typeof postgres>
let adminDb: ReturnType<typeof drizzle>
let appClient: ReturnType<typeof postgres>
let appDb: ReturnType<typeof drizzle>

// Test data — unique per run to avoid collisions
const ts = Date.now()
const org1Id = `rls-test-org-1-${ts}`
const org2Id = `rls-test-org-2-${ts}`
const user1Id = `rls-test-user-1-${ts}`
const user2Id = `rls-test-user-2-${ts}`
const member1Id = `rls-test-member-1-${ts}`
const member2Id = `rls-test-member-2-${ts}`

beforeAll(async () => {
	// Admin connection for setup/teardown (superuser, bypasses RLS)
	adminClient = postgres(ADMIN_DB_URL, { max: 1 })
	adminDb = drizzle(adminClient, { schema })

	// App connection for RLS tests (non-superuser, respects RLS)
	appClient = postgres(APP_DB_URL, { max: 1 })
	appDb = drizzle(appClient, { schema })

	// Create test data as admin (bypasses RLS)
	await adminDb.insert(schema.users).values([
		{ id: user1Id, name: 'User One', email: `user1-${ts}@test.com`, emailVerified: false },
		{ id: user2Id, name: 'User Two', email: `user2-${ts}@test.com`, emailVerified: false },
	])

	await adminDb.insert(schema.organizations).values([
		{ id: org1Id, name: 'Org One', slug: `org-one-${ts}` },
		{ id: org2Id, name: 'Org Two', slug: `org-two-${ts}` },
	])

	await adminDb.insert(schema.members).values([
		{ id: member1Id, organizationId: org1Id, userId: user1Id, role: 'owner' },
		{ id: member2Id, organizationId: org2Id, userId: user2Id, role: 'owner' },
	])
})

afterAll(async () => {
	// Clean up test data as admin (bypasses RLS)
	await adminDb.execute(sql`DELETE FROM "member" WHERE id IN (${member1Id}, ${member2Id})`)
	await adminDb.execute(sql`DELETE FROM "organization" WHERE id IN (${org1Id}, ${org2Id})`)
	await adminDb.execute(sql`DELETE FROM "user" WHERE id IN (${user1Id}, ${user2Id})`)
	await appClient.end()
	await adminClient.end()
})

describe('RLS Tenant Isolation', () => {
	it('returns only members for org1 when tenant is set to org1', async () => {
		const results = await appDb.transaction(async (tx) => {
			await tx.execute(sql`SELECT set_config('app.current_tenant', ${org1Id}, true)`)
			return tx.select().from(schema.members)
		})

		// Should only see org1's member (our test member, plus possibly others from dev data)
		const testMembers = results.filter((m) => [member1Id, member2Id].includes(m.id))
		expect(testMembers).toHaveLength(1)
		expect(testMembers[0]!.id).toBe(member1Id)
		expect(testMembers[0]!.organizationId).toBe(org1Id)
	})

	it('returns only members for org2 when tenant is set to org2', async () => {
		const results = await appDb.transaction(async (tx) => {
			await tx.execute(sql`SELECT set_config('app.current_tenant', ${org2Id}, true)`)
			return tx.select().from(schema.members)
		})

		const testMembers = results.filter((m) => [member1Id, member2Id].includes(m.id))
		expect(testMembers).toHaveLength(1)
		expect(testMembers[0]!.id).toBe(member2Id)
		expect(testMembers[0]!.organizationId).toBe(org2Id)
	})

	it('prevents cross-tenant access — org1 tenant cannot see org2 members', async () => {
		const results = await appDb.transaction(async (tx) => {
			await tx.execute(sql`SELECT set_config('app.current_tenant', ${org1Id}, true)`)
			return tx.select().from(schema.members)
		})

		const org2Members = results.filter((m) => m.organizationId === org2Id)
		expect(org2Members.length).toBe(0)
	})

	it('SET LOCAL is transaction-scoped — does not leak between transactions', async () => {
		// Set tenant to org1 in one transaction
		await appDb.transaction(async (tx) => {
			await tx.execute(sql`SELECT set_config('app.current_tenant', ${org1Id}, true)`)
		})

		// In a new transaction, the setting should not persist
		const result = await appDb.transaction(async (tx) => {
			const setting = await tx.execute(
				sql`SELECT current_setting('app.current_tenant', true) as tenant`
			)
			return (setting as any)[0]?.tenant
		})

		// The tenant setting should be empty/null, not org1Id
		expect(result).not.toBe(org1Id)
	})
})
