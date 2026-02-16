import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import type * as schema from '@crm/db/schema'

/**
 * Drizzle database client type.
 * Uses PgDatabase which is the common base for both PostgresJsDatabase and PgTransaction.
 */
export type DrizzleDB = PgDatabase<PostgresJsQueryResultHKT, typeof schema>
