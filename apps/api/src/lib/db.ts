import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@crm/db/schema'
import { env } from '../env.js'

// Connection for queries (pooled)
const client = postgres(env.DATABASE_URL)

export const db = drizzle(client, { schema })

// Connection for migrations (non-pooled, single connection)
export function createMigrationClient() {
	const migrationClient = postgres(env.DATABASE_URL, { max: 1 })
	return drizzle(migrationClient, { schema })
}
