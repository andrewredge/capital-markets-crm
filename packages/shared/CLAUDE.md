# Shared Package — `packages/shared/`

> Inherits all patterns from root `CLAUDE.md`. This file adds shared package rules.

## Scope
All agents use this package. It is the single source of truth for validators, types, and constants shared between API and frontend.

## Critical Constraint: Isomorphic Code Only

This package runs in **both Node.js (API) and the browser (Next.js)**. Therefore:

- NO Node.js-specific APIs (fs, path, crypto, process, Buffer)
- NO server-only packages (drizzle-orm, pg, better-auth internals)
- NO `"use client"` or `"use server"` directives
- Dependencies must be isomorphic (Zod is fine, node-postgres is not)

If you need server-only shared code, it belongs in `packages/db/` or `apps/api/`, not here.

## Structure
```
src/
├── index.ts              # Barrel export for everything
├── validators/
│   ├── index.ts          # Re-exports all validators
│   ├── auth.ts           # Login, register, org creation schemas
│   └── {entity}.ts       # One file per entity
├── types/
│   ├── index.ts          # Re-exports all types
│   └── {entity}.ts       # Inferred types + additional type definitions
└── constants/
    ├── index.ts          # Re-exports all constants
    └── {domain}.ts       # Enums, config values, magic strings
```

## Zod as Single Source of Truth

Zod schemas in this package are the **canonical definition** for:
- tRPC input validation (API)
- React Hook Form validation (frontend)
- TypeScript type inference (both)

### Pattern: Schema + Inferred Types

```typescript
// validators/contacts.ts
import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  companyId: z.string().uuid().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// types/contacts.ts
import type { z } from "zod";
import type { createContactSchema, updateContactSchema } from "../validators/contacts";

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
```

**Rules:**
- Never duplicate Zod schemas — import from this package everywhere
- Use `.partial()` for update schemas (all fields optional)
- Keep validation messages user-friendly (they appear in the UI)
- Do NOT include `id`, `tenantId`, `createdAt`, `updatedAt` in create/update schemas — the API manages these
- Use `z.string().uuid()` for ID references to other entities

## Constants

```typescript
// constants/deals.ts
export const DEAL_STAGES = ["sourcing", "screening", "due_diligence", "ic_review", "closed_won", "closed_lost"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
```

- Use `as const` arrays for enums that need both runtime values and types
- Export the derived type alongside the constant
- These must match the corresponding `pgEnum` definitions in `packages/db`

## Versioning
This is a workspace package — no npm publishing. Version is `0.0.0` and stays that way. Import via workspace protocol: `"@capital-markets-crm/shared": "workspace:*"`.
