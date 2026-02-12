import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@crm/db/schema'

const connectionString = process.env.DATABASE_URL!

// Connection for queries (pooled)
const client = postgres(connectionString)

export const db = drizzle(client, { schema })

// Connection for migrations (non-pooled, single connection)
export function createMigrationClient() {
	const migrationClient = postgres(connectionString, { max: 1 })
	return drizzle(migrationClient, { schema })
}
