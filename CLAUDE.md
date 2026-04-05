@AGENTS.md

# Maika - Campus Phone Card Sales Tracking System

> Last scanned: 2026-04-05T09:53:12 | 150 source files | ~16.5K lines

## Project Vision

Maika is an internal campus phone card sales tracking and commission settlement system. It serves three user roles (Admin, Leader, Member) to manage daily sales entry, leaderboard rankings, commission settlement, identifier code distribution, prospect lead assignment, and group-level workbench operations. Deployed on Vercel with PostgreSQL.

## Architecture Overview

```mermaid
graph TB
  subgraph Client["Frontend (React 19 + Tailwind 4)"]
    direction TB
    Admin["Admin Dashboard<br/>(admin)"]
    Leader["Leader Workbench<br/>(leader)"]
    Member["Member Entry<br/>(entry + records)"]
    Shared["Shared Pages<br/>(leaderboard)"]
    Auth["Auth Pages<br/>(login)"]
  end

  subgraph Server["Server Layer"]
    direction TB
    Actions["Server Actions<br/>(per-page actions.ts)"]
    Services["Service Layer<br/>(src/server/services/)"]
    Validators["Zod Validators<br/>(src/lib/validators/)"]
    LibCore["Core Lib<br/>(auth, db, env, permissions)"]
  end

  subgraph Data["Data Layer"]
    direction TB
    Prisma["Prisma Client<br/>(src/lib/db.ts)"]
    PG["PostgreSQL"]
    Migrations["6 Migrations"]
  end

  subgraph API["API Routes"]
    ExportAPI["Export API<br/>(daily, range, settlement)"]
    AuthAPI["Auth.js v5<br/>(JWT strategy)"]
  end

  Client --> Actions --> Services
  Client --> API --> Services
  Services --> Validators
  Services --> LibCore
  Services --> Prisma --> PG
  Prisma --> Migrations
  LibCore --> Prisma
```

## Module Structure

```mermaid
graph TD
    Root["Maika (root)"] --> SrcApp["src/app"]
    Root --> SrcComp["src/components"]
    Root --> SrcServer["src/server/services"]
    Root --> SrcLib["src/lib"]
    Root --> PrismaDir["prisma"]
    Root --> Tests["tests"]

    SrcApp --> AdminPages["(admin)/admin"]
    SrcApp --> LeaderPages["(leader)/leader"]
    SrcApp --> MemberPages["(member)"]
    SrcApp --> SharedPages["(shared)/leaderboard"]
    SrcApp --> AuthPages["(auth)/login"]
    SrcApp --> ApiRoutes["api"]

    SrcComp --> AdminComp["admin (25)"]
    SrcComp --> LeaderComp["leader (6)"]
    SrcComp --> SharedComp["shared (27)"]

    Tests --> UnitTests["unit (71)"]
    Tests --> E2ETests["e2e (9)"]

    click AdminPages "./src/app/(admin)/admin/CLAUDE.md" "Admin Pages"
    click LeaderPages "./src/app/(leader)/leader/CLAUDE.md" "Leader Pages"
    click MemberPages "./src/app/(member)/CLAUDE.md" "Member Pages"
    click SharedPages "./src/app/(shared)/leaderboard/CLAUDE.md" "Shared Pages"
    click AuthPages "./src/app/(auth)/login/CLAUDE.md" "Auth Pages"
    click ApiRoutes "./src/app/api/CLAUDE.md" "API Routes"
    click SrcServer "./src/server/services/CLAUDE.md" "Service Layer"
    click SrcLib "./src/lib/CLAUDE.md" "Core Library"
    click SrcComp "./src/components/CLAUDE.md" "UI Components"
    click PrismaDir "./prisma/CLAUDE.md" "Database Layer"
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI | React + Tailwind CSS | 19.2.4 / 4 |
| Language | TypeScript (strict) | 5 |
| ORM | Prisma | 6.19.2 |
| Auth | Auth.js (next-auth v5) | beta.30 |
| Validation | Zod | 4.3.6 |
| DB | PostgreSQL | - |
| Deployment | Vercel | - |
| Monitoring | @vercel/analytics + @vercel/speed-insights | 2.0.1 / 2.0.0 |
| Testing | Vitest (unit) + Playwright (e2e) | 4.1.1 / 1.58.2 |
| Export | ExcelJS | 4.4.0 |
| Password | bcryptjs | 3.0.3 |

## Role-Based Access

| Role | Default Route | Access Scope |
|------|--------------|--------------|
| ADMIN | `/admin` | Admin + Member + Shared pages |
| LEADER | `/leader/group` | Leader + Shared pages |
| MEMBER | `/entry` | Member + Shared pages |

RBAC enforced at two layers:
1. **Proxy (middleware)**: `src/proxy.ts` wraps `auth()` to redirect unauthenticated/unauthorized requests
2. **Permission helpers**: `src/lib/permissions.ts` provides `canAccessAdmin`, `canAccessLeader`, `canAccessMemberArea`

Route groups `(admin)`, `(leader)`, `(member)` mirror role boundaries.

## Module Index

| Module | Path | Files | Description |
|--------|------|-------|-------------|
| Admin Pages | `src/app/(admin)/admin/` | 10 pages, 8 actions, 7 form-states | Member/code/sales/insights/settlement management |
| Leader Pages | `src/app/(leader)/leader/` | 2 pages, 2 actions | Group workbench, leader sales tracking |
| Member Pages | `src/app/(member)/` | 2 pages, 1 action, 1 form-state | Sales entry, personal records |
| Shared Pages | `src/app/(shared)/leaderboard/` | 3 pages | Daily/range/group leaderboards |
| Auth Pages | `src/app/(auth)/login/` | 1 page, 1 action, 1 form-state | Login form + credential auth |
| API Routes | `src/app/api/` | 4 routes | Auth handler + 3 Excel export endpoints |
| Admin Components | `src/components/admin/` | 25 components | Admin-only tables, forms, panels |
| Leader Components | `src/components/leader/` | 6 components | Workbench ranking, follow-up, audit |
| Shared Components | `src/components/` | 27 components | Shell, charts, forms, entry UI |
| Service Layer | `src/server/services/` | 24 modules | All business logic + caching |
| Validators | `src/lib/validators/` | 13 schemas | Zod validation for all domains |
| Core Lib | `src/lib/` | 8 modules | auth, db, env, permissions, password, theme, content-types, auth-session-cookie |
| Prisma Schema | `prisma/` | 15 models, 6 migrations, seed | Database schema + seed data |
| Unit Tests | `tests/unit/` | 71 test files | Vitest (jsdom) |
| E2E Tests | `tests/e2e/` | 9 test files | Playwright (Chromium) |

## Key Conventions

- **Path alias**: `@/*` maps to `src/*`
- **Middleware**: Next.js 16 uses `src/proxy.ts` (renamed from `middleware.ts`); wraps `auth()` for route protection
- **Server Actions**: each page folder has `actions.ts` + optional `form-state.ts`; all mutations go through Server Actions, never API routes
- **Service layer**: all business logic in `src/server/services/` -- no direct ORM calls in actions or components
- **Validation**: Zod schemas in `src/lib/validators/`, used in both actions and services
- **Auth**: JWT sessions via Auth.js v5, role stored in token, typed in `src/types/next-auth.d.ts`
- **DB singleton**: `src/lib/db.ts` exports `db` (PrismaClient), dev hot-reload safe via globalThis
- **Env validation**: `src/lib/env.ts` parses required env vars at startup with Zod
- **Caching**: 4 service-layer caches using `unstable_cache` with tag-based invalidation:
  - `leaderboard-cache` (30s TTL, tag: `leaderboard`)
  - `entry-insights-cache` (30s TTL, tag: `entry-insights`)
  - `shell-content-cache` (60s TTL, tag: `shell-content`)
  - `member-records-cache` (30s TTL, tag: `member-records`)
- **Cache invalidation**: uses `updateTag()` for tag-based revalidation + `revalidatePath()` for specific routes
- **Sales data aggregation**: `sales-reporting-service.ts` merges two sources (IdentifierSale + legacy SalesRecord), IdentifierSale takes priority per user-day
- **Theming**: 6 color themes stored in localStorage, SSR-safe via inline script in `<head>`
- **No API routes for mutations**: API routes only serve Excel export downloads (daily/range/settlement)
- **Time zone**: `Asia/Shanghai` is the default for date calculations

## Database Models (15)

```mermaid
erDiagram
  User ||--o{ SalesRecord : "submits"
  User ||--o{ CommissionRule : "has"
  User ||--o{ DailyTarget : "has"
  User ||--o{ MemberReminder : "receives"
  User }o--o| Group : "belongs to"
  User ||--o| Group : "leads"

  Group ||--o{ ProspectLead : "assigned"
  Group ||--o{ IdentifierCode : "assigned"
  Group ||--o{ GroupFollowUpItem : "tracks"
  Group ||--o{ GroupResourceAuditLog : "audits"

  IdentifierCode ||--o| IdentifierSale : "sold as"
  ProspectLead ||--o| IdentifierSale : "linked to"
  ProspectLead ||--o{ GroupFollowUpItem : "generates"

  IdentifierImportBatch ||--o{ IdentifierCode : "imports"
  ProspectImportBatch ||--o{ ProspectLead : "imports"
  IdentifierCode ||--o{ CodeAssignment : "assigned via"
```

Key enums: `Role` (MEMBER/LEADER/ADMIN), `SalesReviewStatus` (PENDING/APPROVED/REJECTED), `IdentifierCodeStatus` (UNASSIGNED/ASSIGNED/SOLD), `ProspectLeadStatus` (UNASSIGNED/ASSIGNED/CONVERTED), `GroupFollowUpStatus` (UNTOUCHED/FOLLOWING_UP/APPOINTED/READY_TO_CONVERT/INVALID/CONVERTED), `PlanType` (PLAN_40/PLAN_60).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT signing secret (falls back to `NEXTAUTH_SECRET` or dev default) |
| `AUTH_TRUST_HOST` | No | Trust host header (default: `true` in dev, `false` in prod) |

## Run and Develop

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # prisma generate && next build
npm run start         # Start production server
npm run lint          # ESLint
```

## Test Strategy

```bash
npm test              # Vitest unit tests (71 files)
npm run test:watch    # Vitest in watch mode
npm run test:e2e      # Playwright E2E tests (9 files, Chromium, port 3100)
```

- **Unit tests**: Vitest + jsdom, `tests/unit/`, path alias via `vitest.config.ts`
- **E2E tests**: Playwright, `tests/e2e/`, single worker, auto-starts dev server on port 3100
- **Test coverage areas**: services, validators, actions, components, cache layers, page rendering
- **Mocking pattern**: service modules are mocked at import boundary in action/page tests

## Coding Conventions

- TypeScript strict mode, target ES2017
- `satisfies` operator used extensively for type-safe return shapes
- Service functions return typed DTOs, not raw Prisma objects
- Chinese locale (`zh-CN`) used for sorting names (`localeCompare`)
- Decimal fields use `Decimal(10,2)` in Prisma, converted via `.toString()` for serialization
- Date values use `DateValue` branded type (`YYYY-MM-DD` string)
- Export filenames follow `{type}-{date}.xlsx` pattern
- Seed script creates default admin (`admin/admin123456`) and member (`member01/member123456`)

## Design System
Always read `DESIGN.md` before making any visual or UI decisions. All font choices, colors, spacing, border-radius, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match DESIGN.md.

## AI Usage Guidelines

- Always read `AGENTS.md` for Next.js 16 breaking changes before writing code
- Service layer is the single source of truth for business logic -- never bypass it
- When adding a new page: create `page.tsx` + `actions.ts` + optional `form-state.ts`
- When adding a new service: place in `src/server/services/`, export typed DTOs
- When adding a new validator: place in `src/lib/validators/`, use Zod
- Cache invalidation: call `refreshLeaderboardCaches()` / `refreshShellContent()` / etc. from actions after mutations
- All audit-sensitive operations in leader workbench use `$transaction` with before/after snapshots

## File Statistics

- Source files: 150 (`.ts` + `.tsx`)
- Components: 58 (25 admin + 6 leader + 27 shared)
- Server services: 24
- Validators: 13
- Page/route files: 24 (20 pages + 4 routes)
- Actions: 12
- Form states: 9
- Unit tests: 71
- E2E tests: 9
- Prisma models: 15
- Migrations: 6
- Total source lines: ~16,524

## Changelog

| Date | Description |
|------|-------------|
| 2026-04-05T09:53:12 | Full rescan: corrected counts (71 unit tests, 24 services, 13 validators, 58 components), added module structure graph, expanded caching/convention docs, added module-level CLAUDE.md files |
| 2026-04-05 | Initial scan: 150 source files, 15 Prisma models, basic architecture docs |
