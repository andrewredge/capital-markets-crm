# Frontend Agent — `apps/web/`

> Inherits all patterns from root `CLAUDE.md`. This file adds frontend-specific rules.

## Scope
- `apps/web/` — Next.js App Router frontend
- `packages/shared/` — Read access for validators and types

## Route Groups

### `(auth)` — Public auth pages
```
src/app/(auth)/
├── login/page.tsx
├── register/page.tsx
└── layout.tsx          # Centered card layout, no sidebar
```

### `(dashboard)` — Authenticated app shell
```
src/app/(dashboard)/
├── layout.tsx          # Sidebar + header + main content area
├── page.tsx            # Dashboard home
├── contacts/
├── companies/
├── deals/
└── settings/
```

## Component Conventions

### File Structure
```
src/components/
├── ui/               # shadcn/ui primitives (DO NOT modify directly)
├── layout/           # Shell, sidebar, header, breadcrumbs
├── {entity}/         # Entity-specific components
│   ├── {entity}-form.tsx
│   ├── {entity}-columns.tsx    # TanStack Table column defs
│   ├── {entity}-card.tsx
│   └── {entity}-detail.tsx
└── shared/           # Cross-entity reusable components
```

**Rules:**
- One component per file, named export matching filename (PascalCase)
- Use `"use client"` only when the component needs interactivity (hooks, event handlers)
- Default to Server Components — add `"use client"` only when required
- Never use `"use client"` on page or layout files unless absolutely necessary

### shadcn/ui
- Components installed to `src/components/ui/`
- Import as `@/components/ui/{component}`
- Do NOT modify generated shadcn/ui files — extend via wrapper components if needed
- Use `cn()` utility from `@/lib/utils` for conditional classes

### Tailwind CSS v4
- Config in `src/app/globals.css` using `@theme` directive (not `tailwind.config.ts`)
- Use design tokens defined in CSS variables: `--color-primary`, `--color-muted`, etc.
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Dark mode: use `dark:` variant, colors should reference CSS variables that swap

## State Management

### Server State — TanStack Query (via tRPC)
- All API data fetched through tRPC hooks (which wrap TanStack Query)
- Use `trpc.{entity}.{method}.useQuery()` for reads
- Use `trpc.{entity}.{method}.useMutation()` for writes
- Invalidate related queries after mutations

### Client State — Zustand
- Only for UI state that doesn't belong on the server: sidebar open/closed, active filters, modal state
- Store files in `src/stores/{store-name}.ts`
- Keep stores small and focused — one per concern

## Forms
- React Hook Form + Zod for all forms
- Import Zod schemas from `@capital-markets-crm/shared`
- Use `zodResolver` to connect Zod schema to React Hook Form
- Wrap shadcn/ui inputs with Form components from `@/components/ui/form`

## Auth UI
- Use Better Auth's React client (`authClient`) for login/register/logout
- Session available via `authClient.useSession()` hook
- Protect dashboard routes via middleware (`src/middleware.ts`)
- Redirect unauthenticated users to `/login`

## Testing
- Unit tests: Vitest + React Testing Library (colocated or in `__tests__/`)
- E2E tests: Playwright in `e2e/` directory
- Test user interactions, not implementation details

## Key Files
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, providers |
| `src/app/(dashboard)/layout.tsx` | Dashboard shell |
| `src/lib/trpc.ts` | tRPC client setup |
| `src/lib/auth-client.ts` | Better Auth client |
| `src/lib/utils.ts` | `cn()` and shared utilities |
| `src/middleware.ts` | Auth route protection |
| `src/stores/` | Zustand stores |
