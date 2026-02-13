# Data Model Agent — `packages/db/`

> Inherits all patterns from root `CLAUDE.md`. This file adds database-specific rules.

## Scope
- `packages/db/` — Drizzle schema, migrations, seed data
- `packages/shared/src/validators/` — Corresponding Zod validators (must stay in sync)

## Schema Structure
```
src/schema/
├── index.ts          # Re-exports all tables and relations
├── auth.ts           # Better Auth tables (users, sessions, accounts, organizations, members)
├── {entity}.ts       # One file per entity domain
└── enums.ts          # Shared pgEnum definitions
```

## Table Template

Every tenant-scoped table MUST follow this pattern:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authUid, tenantId } from "./common"; // shared column helpers

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    // ... entity-specific columns
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
  },
  (table) => [
    pgPolicy("tenant_isolation", {
      as: "permissive",
      for: "all",
      using: sql`tenant_id = current_setting('app.current_tenant')`,
    }),
  ]
);
```

**Required columns for ALL tenant-scoped tables:**
- `id` — UUID with `defaultRandom()`
- `tenant_id` — `text`, NOT NULL, references organization
- `created_at` — timestamp with timezone, `defaultNow()`
- `updated_at` — timestamp with timezone, `defaultNow()`

**Column naming:**
- Database columns: `snake_case` (e.g., `first_name`, `tenant_id`)
- Drizzle JS properties: `camelCase` (e.g., `firstName`, `tenantId`)
- Drizzle handles the mapping automatically

## RLS Policy Rules

1. Every tenant-scoped table gets a `tenant_isolation` policy
2. Policy uses `current_setting('app.current_tenant')` — set by API middleware
3. Enable RLS on the table: the migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
4. The API's database role must NOT be a superuser (superusers bypass RLS)
5. Non-tenant tables (e.g., system config) do NOT get RLS policies

## Relations

Define Drizzle relations in the same file as the table:

```typescript
import { relations } from "drizzle-orm";

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  deals: many(dealParticipants),
}));
```

## Migration Workflow

1. Modify schema files in `src/schema/`
2. Run `pnpm db:generate` to create migration SQL
3. Review the generated migration in `drizzle/` — check for destructive changes
4. Run `pnpm db:migrate` to apply
5. Never hand-edit migration files after they've been applied

**For development iteration:** `pnpm db:push` skips migration files (schema-only push). Use this for rapid prototyping, but always generate proper migrations before committing.

## Seed Data

- Seed script in `src/seed.ts`
- Must create at least 2 tenants with distinct data to verify RLS isolation
- Use realistic capital markets data (not lorem ipsum)
- Seed data should cover: users, organizations, contacts, companies, deals
- Run via `pnpm db:seed`

## Drizzle Config
- Config file: `drizzle.config.ts` at package root
- Schema path: `./src/schema/index.ts`
- Migrations output: `./drizzle/`
- Database URL from environment

## Key Files
| File | Purpose |
|------|---------|
| `src/schema/index.ts` | Schema barrel export |
| `src/schema/auth.ts` | Better Auth tables |
| `src/index.ts` | Drizzle client factory |
| `src/seed.ts` | Development seed data |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `drizzle/` | Generated migration files |
