# Backend Agent — `apps/api/`

> Inherits all patterns from root `CLAUDE.md`. This file adds API-specific rules.

## Scope
- `apps/api/` — Hono server, tRPC routers, services, middleware
- `packages/db/` — Read access for schema references (Data Model agent owns writes)

## Architecture

### Server Entry Point
- `src/index.ts` — Hono app with tRPC adapter, CORS, Better Auth mount
- Better Auth handles `/api/auth/**` routes directly via Hono
- tRPC handles all other API routes via `/trpc/**`

### tRPC Router Pattern
```
src/trpc/
├── context.ts        # Creates context with session, db, tenantId
├── trpc.ts           # initTRPC, procedure helpers (public/protected/tenant/admin)
├── router.ts         # Root router merging all entity routers
└── routers/
    └── {entity}.ts   # One file per entity
```

**Router rules:**
- Import Zod schemas from `@capital-markets-crm/shared` for input validation
- Use `tenantProcedure` for all tenant-scoped operations (never `protectedProcedure` alone)
- Use `adminProcedure` for admin-only operations
- Routers call services — no direct Drizzle queries in router files
- Every mutation returns the affected entity (not void)

### Service Layer Pattern
```
src/services/
└── {entity}.ts       # Pure business logic, Drizzle queries
```

**Service rules:**
- Accept `db: DrizzleClient` as first parameter (dependency injection for testing)
- No HTTP/tRPC awareness — no `ctx`, no `TRPCError` throws
- Throw plain `Error` with descriptive messages; routers translate to `TRPCError`
- Always use the transaction-scoped `db` passed in (RLS context is already set)

### Middleware Chain
```
1. publicProcedure     — no auth required
2. protectedProcedure  — requires valid session (Better Auth)
3. tenantProcedure     — sets RLS context via SET LOCAL
4. adminProcedure      — tenantProcedure + role check (admin/owner)
```

### RLS Middleware
- Runs inside `tenantProcedure`
- Executes `SET LOCAL app.current_tenant = $1` at the start of each request
- Uses a Drizzle transaction to ensure the SET LOCAL is scoped to the request
- Never trust client-provided tenant ID — derive from session's active organization

### Better Auth Integration
- Auth instance created in `src/auth.ts`
- Uses `organization` plugin for multi-tenancy
- Session includes `activeOrganizationId` — this is the tenant context
- Mount auth handler on Hono: `app.on(["POST", "GET"], "/api/auth/**", authHandler)`

## Testing
- Tests live in `src/__tests__/` or colocated as `{module}.test.ts`
- Use Vitest
- Mock the database layer for unit tests
- Integration tests use a test database with RLS enabled

## Key Files
| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry, Hono app |
| `src/auth.ts` | Better Auth instance |
| `src/trpc/trpc.ts` | tRPC init + procedure definitions |
| `src/trpc/context.ts` | Request context factory |
| `src/trpc/router.ts` | Root router |
| `src/env.ts` | Environment variable validation |
