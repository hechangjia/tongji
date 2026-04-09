# CLAUDE.md

This file provides guidance to ClaudeCode (claude.ai/code) when workingwith code in this repository.

@AGENTS.md

## Project Overview

Maika is a campus phone cardsales tracking and commission settlement system. Three roles: `ADMIN` (full management), `LEADER` (group oversight +workbench), `MEMBER` (daily sales entry + records). Deployed on Vercel + PostgreSQL.

## Commands

```bash
npm run dev# Start dev server (Turbopack)
npm run build                             # prisma generate &&next build
npm run lint                              # ESLint (flat config)
npm test                                  #Vitest — all unittests
npm run test:watch                        # Vitest in watch mode
npm run test:e2e                          # Playwright (single worker, port 3100)
npx vitest run tests/unit/foo.test.ts     # Single test file
npx prisma validate                       # Validate schema
npx prisma migrate dev                    # Run migrations
npx tsx prisma/seed.ts# Seed database
```

## Architecture

```
src/
app/                         # Next.js 16 App Router
    (admin)/admin/              # Admin pages (members, salesreview, settlement, content, codes,leads, insights)
    (leader)/leader/            # Leader pages (group info + salesworkbench)
    (member)/                   # Member pages (entry + records)
    (shared)/leaderboard/       # Shared leaderboards (daily, range, groups)
    (auth)/login/               # Login+ register + rate-limiting
    api/                        # Auth.js handlers + Excel export
  components/# UI components (admin/, leader/, shared, ui/)
  server/services/              # ALL business logic lives here (26service files)
  lib/                          # Core infra (auth, db, env, permissions, validators, rate-limit)
prisma/                         # Schema (17 models), seed, 7 migrations
tests/
  unit/                         # ~72 test files (Vitest + jsdom)
  e2e/# 9 Playwright scenarios
  setup/vitest.setup.ts         # @testing-library/jest-dom/vitest
```

### Request Flow

1. `src/proxy.ts` (middleware) — route matching + auth + role-based access control
2. RSC pages — concurrent data reads viacached service calls
3. Server Actions (`actions.ts`files) — mutations, Zod validation, cache invalidation
4. `src/server/services/` — business logic,Prisma queries, transactional guardrails
5. `src/lib/validators/` — 13 Zod schemasfor input validation

### Auth System

- Auth.js v5(next-auth beta) with Credentials provider
- JWT sessions,2-hour max age
- User status re-checkedfrom DB every 5 minutes in JWT callback
- Deactivated users get cookies cleared in middleware
- Registrationrequires invite code (default: `maika2026`)
- Login rate-limiting in `src/lib/rate-limit.ts`
- Key files: `src/lib/auth.ts`, `src/lib/permissions.ts`, `src/proxy.ts`, `src/lib/env.ts`

### Permission Model

- `src/lib/permissions.ts` — pure role-checking functions (`canAccessAdmin`, `canAccessLeader`, `canAccessMemberArea`)
- `src/proxy.ts` — middleware that enforces permissionsat route level
- Layouts and Actions also call permissionfunctions directly

### Caching Architecture

Five dedicatedcache modules in `src/server/services/`:

- `leaderboard-cache.ts` — leaderboard data + admin rhythm/trendstats (tag:`leaderboard`)
- `entry-insights-cache.ts` — member entry page insights(tag: `entry-insights`)
- `member-records-cache.ts` — member historyrecords (tag: `member-records`)
- `shell-content-cache.ts` — banners + announcements (tag: `shell-content`)
- `admin-insights-cache.ts`— admin dashboard insights (tag: `admin-insights`)

Pattern: `unstable_cache` with`updateTag` for invalidation + `revalidatePath` for page-level refresh. Somecaches use lazy initialization (dynamicimport) to avoid circular dependencies.

**After mutations**, actionsfan out cache refreshes. A member sales entrytouches: leaderboard, entry-insights, member-records, admin-insights. Identifier sales additionally touch leader-workbench caches.

## Coding Conventions

- **Next.js 16 App Router** — default Server Components; only use `'use client'` for interactive components
- **Mutations** go through Server Actions; Route Handlers are read-only
- **Businesslogic** belongs in `src/server/services/` only — pages and actions never write Prisma queries directly
- **Form inputs** are Zod-validated before reaching services; services return DTOs, not raw Prisma entities
- **Newpages** follow pattern: `page.tsx` + `actions.ts` + optional `form-state.ts`
- **New services** go in `src/server/services/`; new validators in `src/lib/validators/`
- **Default timezone**: `Asia/Shanghai`
- **UI design**: read `DESIGN.md` before making UI decisions — Glassmorphic Industrial aesthetic, Bento Box layout, specific typography stack
- **Path alias**: `@/` maps to `src/`

## Key Domain Rules

- A member cannot have both a traditional `SalesRecord` and an `IdentifierSale` on the same day
- Identifier sales cascade: update prospect lead status, follow-up items, and group workbench data
- Auditable operations (resource reassignment, status changes) must preserve before/after snapshots in `GroupResourceAuditLog`
- Sales records have a review workflow: PENDING -> APPROVED/REJECTED
- Commission rules have effective date ranges; settlement export uses `exceljs`

## Environment Variables

- `DATABASE_URL` — required
- `AUTH_SECRET` — required (falls back to `NEXTAUTH_SECRET`; dev has default)
- `AUTH_TRUST_HOST` — optional (dev: `true`, prod: `false`)
- `INVITE_CODE` — registration invite code (default: `maika2026`)

## Testing Conventions

- Unit tests: `tests/unit/` — Vitest with jsdom, `@testing-library/react`
- E2E: `tests/e2e/` — Playwright, single chromium worker
- Schema contract test: `tests/unit/prisma-schema-contract.test.ts` locks models/enums/migrations
- Page tests verify: RSC concurrent reads, permission redirects, component rendering
- Service tests verify: transactional correctness, cache invalidation, edge cases

##Module-Level Documentation

Each major directory has its own `CLAUDE.md` with detailed context:

- `src/app/(admin)/admin/CLAUDE.md`
- `src/app/(leader)/leader/CLAUDE.md`
- `src/app/(member)/CLAUDE.md`
- `src/app/(shared)/leaderboard/CLAUDE.md`
- `src/app/(auth)/login/CLAUDE.md`
- `src/app/api/CLAUDE.md`
- `src/components/CLAUDE.md`
- `src/server/services/CLAUDE.md`
- `src/lib/CLAUDE.md`
- `prisma/CLAUDE.md`

## .context Project Context

- Coding style: `.context/prefs/coding-style.md`
- Workflow rules: `.context/prefs/workflow.md`
- Decision history: `.context/history/commits.md`

Rule: read `prefs/` before modifyingcode; log decisions per `workflow.md`.
