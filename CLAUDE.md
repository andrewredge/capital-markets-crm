# Capital Markets CRM

## Overview
A purpose-built CRM for capital markets professionals (VC, PE, M&A, investment banking). Models startups, listed companies, investors, deal flow with multi-participant roles, and configurable pipelines.

**Current Phase: 5 (Import & Data Tools) — Phases 0–4 complete, Phase 5A done, Phase 5B.1 done**

## Tech Stack
| Layer | Choice | Version |
|-------|--------|---------|
| Monorepo | Turborepo + pnpm workspaces | turbo 2.x, pnpm 10.x |
| API | Hono on Node.js | 4.x |
| API Protocol | tRPC | 11.x |
| Database | PostgreSQL | 16+ |
| ORM | Drizzle | 0.45.x |
| Auth | Better Auth + Organization plugin | 1.4.x |
| Frontend | Next.js (App Router) | 15.x |
| UI | shadcn/ui + Tailwind CSS | v4 |
| Tables | TanStack Table | 8.x |
| Forms | React Hook Form + Zod | |
| State | TanStack Query (server) + Zustand (UI) | |
| Validation | Zod | 3.x |
| Linting | Biome | 2.x |
| Testing | Vitest + Playwright | |

## Project Structure
```
CRM/
├── apps/
│   ├── api/          # Hono + tRPC API server (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── db/           # Drizzle schema, migrations, seed
│   └── shared/       # Zod validators, types, constants
├── docker/           # Docker Compose (PostgreSQL)
└── CLAUDE.md         # This file
```

## Architecture Patterns

### Multi-Tenancy (RLS)
- Every tenant-scoped table has `tenant_id` column
- PostgreSQL Row-Level Security enforces isolation at DB level
- API sets `SET LOCAL app.current_tenant = '<org_id>'` per request
- Services NEVER manually filter by tenant — the database handles it

### tRPC Middleware Chain
```
publicProcedure → protectedProcedure (auth check) → tenantProcedure (RLS context)
```

### Service Layer
- tRPC routers handle input validation (Zod) and call services
- Services contain business logic and use Drizzle for DB access
- Services are unaware of HTTP/tRPC — pure business logic

### Auth & Authorization (3 levels)
1. **Database (RLS):** Tenant isolation — no cross-tenant access
2. **tRPC middleware:** `protectedProcedure` (authenticated) → `adminProcedure` (admin/owner)
3. **Service layer:** Business rules (e.g., only deal owner or admin can change stage)

## Naming Conventions
| Context | Convention | Example |
|---------|-----------|---------|
| TypeScript | camelCase | `contactId`, `firstName` |
| DB columns | snake_case | `contact_id`, `first_name` |
| DB tables | snake_case plural | `contacts`, `deal_participants` |
| Drizzle schema | camelCase table var | `export const contacts = pgTable(...)` |
| tRPC routers | camelCase | `contacts.getById` |
| React components | PascalCase | `ContactList`, `DealKanban` |
| Files (TS/TSX) | kebab-case | `contact-list.tsx`, `deal-kanban.tsx` |
| CSS classes | Tailwind utility classes | No custom CSS classes |

## New Entity Checklist
When adding a new entity (e.g., contacts, companies, deals):

1. **Schema** — `packages/db/src/schema/{entity}.ts`
   - Define pgTable with `tenant_id`, timestamps
   - Add RLS policies via `pgPolicy()`
   - Export from `packages/db/src/schema/index.ts`

2. **Validators** — `packages/shared/src/validators/{entity}.ts`
   - Create/update Zod schemas (source of truth for forms + tRPC)
   - Export from `packages/shared/src/validators/index.ts`

3. **tRPC Router** — `apps/api/src/trpc/routers/{entity}.ts`
   - CRUD procedures using protectedProcedure
   - Input validation via shared Zod schemas
   - Merge into root router

4. **Service** — `apps/api/src/services/{entity}.ts`
   - Business logic, Drizzle queries
   - No HTTP/tRPC awareness

5. **List Page** — `apps/web/src/app/(dashboard)/{entity}/page.tsx`
   - TanStack Table with sorting, filtering, pagination
   - Search bar, filter controls

6. **Detail Page** — `apps/web/src/app/(dashboard)/{entity}/[id]/page.tsx`
   - Entity details, related entities, activity timeline

7. **Components** — `apps/web/src/components/{entity}/`
   - Form, list columns, detail sections, cards

8. **Migration** — Run `pnpm db:generate` then `pnpm db:migrate`

## Commands
```bash
# Development
pnpm dev              # Start all apps (turbo dev)
pnpm build            # Build all apps
pnpm typecheck        # TypeScript check all packages
pnpm lint             # Biome lint all packages
pnpm check            # Biome check + format

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (dev only, no migration files)
pnpm db:seed          # Seed dev data
pnpm db:studio        # Open Drizzle Studio

# Docker
docker compose -f docker/docker-compose.yml up -d    # Start PostgreSQL
docker compose -f docker/docker-compose.yml down      # Stop PostgreSQL
```

## Environment Variables
See `.env.example` for all required variables. Each app has its own `.env`:
- `apps/api/.env` — DATABASE_URL, PORT, BETTER_AUTH_SECRET
- `apps/web/.env` — NEXT_PUBLIC_API_URL

## Agent System

This project uses 6 specialized agent roles for task delegation. Each subdirectory has its own `CLAUDE.md` with domain-specific rules that inherit from this root file.

### Subdirectory CLAUDE.md Files (git-tracked)
| File | Domain |
|------|--------|
| `apps/api/CLAUDE.md` | Backend — tRPC routers, services, auth, RLS middleware |
| `apps/web/CLAUDE.md` | Frontend — components, pages, forms, state, styling |
| `packages/db/CLAUDE.md` | Data Model — schemas, RLS policies, migrations, seed |
| `packages/shared/CLAUDE.md` | Shared — isomorphic validators, types, constants |

### Agent Definitions (git-ignored)
| File | Purpose |
|------|---------|
| `.claude/agents.md` | All 6 agent role definitions with Task tool prompt templates |
| `.claude/templates/session-summary.md` | PM template for end-of-session summaries |
| `.claude/templates/delegation-brief.md` | PM template for Claude/Gemini task specs |
| `.claude/sessions/` | Session summary archive |

### Agent Roles
1. **Architect** — system design, cross-package architecture, security review
2. **Backend** — tRPC routers, services, middleware, auth integration
3. **Frontend** — UI components, pages, forms, client state
4. **Data Model** — Drizzle schemas, RLS policies, migrations, validators
5. **QA** — unit/integration/E2E tests, RLS isolation verification
6. **Project Manager** — session continuity, progress tracking, LLM delegation

See `.claude/agents.md` for full prompt templates.

## Known Issues / TODOs
- [x] Phase 4: Pipeline admin settings UI (Wave 4.3)
- [x] Phase 4: Deals list/Kanban/detail frontend (Wave 4.4)
- [x] Phase 4: E2E tests for deals and pipelines (Wave 4.5)
- [x] Phase 5A: Contact import system — CSV/Excel with column mapping wizard + CLI
- [x] Phase 5B.1: Staleness/enrichment schema, contact classification, company listing status
- [ ] Phase 5B.2: Staleness scoring service + enrichment tRPC router (backend)
- [ ] Phase 5B.3: Enrichment review UI — staleness queue + proposal review
- [ ] Phase 5B.4: Integration tests + E2E
- [ ] Seed data for dev/demo
- [ ] Member invitations (backend + UI)
