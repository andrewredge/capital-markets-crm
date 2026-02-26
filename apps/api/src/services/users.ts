import { eq, inArray } from 'drizzle-orm'
import { users } from '@crm/db/schema'
import type { DrizzleDB } from '../lib/types.js'

/**
 * Resolve user names by IDs.
 * Returns a map of userId → name.
 */
export async function resolveUserNames(db: DrizzleDB, userIds: string[]): Promise<Record<string, string>> {
	if (userIds.length === 0) return {}

	const uniqueIds = [...new Set(userIds)]
	const result = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(inArray(users.id, uniqueIds))

	const nameMap: Record<string, string> = {}
	for (const row of result) {
		nameMap[row.id] = row.name
	}
	return nameMap
}

export async function getUserName(db: DrizzleDB, userId: string): Promise<string | null> {
	const [user] = await db
		.select({ name: users.name })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)

	return user?.name ?? null
}
