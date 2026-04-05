[Root](../../CLAUDE.md) > [src](../) > **lib**

# Core Library Module

## Module Purpose

Shared infrastructure code used across the entire application: authentication, database access, environment validation, permissions, password hashing, theming, and content type definitions.

## Modules (8)

| File | Description |
|------|-------------|
| `auth.ts` | Auth.js v5 configuration: Credentials provider, JWT callbacks, session enrichment |
| `db.ts` | PrismaClient singleton with globalThis caching for dev hot-reload |
| `env.ts` | Zod-validated environment variables (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`) |
| `permissions.ts` | RBAC helpers: `canAccessAdmin`, `canAccessLeader`, `canAccessMemberArea`, route matchers, redirect builders |
| `password.ts` | bcryptjs `hashPassword` (12 rounds) and `verifyPassword` |
| `theme.ts` | 6 color themes (lagoon/sunset/aurora/violet/ember/graphite), SSR bootstrap script, localStorage persistence |
| `content-types.ts` | Shared types: `ShellBannerData`, `ShellBannerItem`, `ShellAnnouncement` |
| `auth-session-cookie.ts` | Cookie detection for Auth.js session tokens (supports chunked cookies) |

## Validators (13 schemas)

Located in `src/lib/validators/`:

| Validator | Domain |
|-----------|--------|
| `auth.ts` | Login + register schemas |
| `sales.ts` | Sales entry, record update, review action |
| `identifier-sale.ts` | Discriminated union: ASSIGNED_LEAD vs MANUAL_INPUT |
| `leader-workbench.ts` | Follow-up creation, reassignment, status update, code reassignment |
| `commission.ts` | Commission rule creation |
| `settlement.ts` | Settlement date range query |
| `member.ts` | Member CRUD |
| `group.ts` | Group CRUD |
| `banner.ts` | Banner quote + settings |
| `announcement.ts` | Announcement CRUD |
| `codes.ts` | Code-related validations |
| `reminder.ts` | Reminder template types |
| `target.ts` | Target adjustment |

## Key Patterns

- **Auth flow**: Credentials provider -> Zod validation -> DB lookup -> bcrypt verify -> JWT token with role/status
- **Session type augmentation**: `src/types/next-auth.d.ts` extends `Session`, `User`, and `JWT` interfaces
- **Env fallback**: `AUTH_SECRET` falls back to `NEXTAUTH_SECRET` then dev default in non-production
- **Theme SSR**: `buildMaikaThemeBootstrapScript()` generates inline JS for `<script>` in `<head>` to prevent FOUC

## Tests

Unit: `auth`, `codes-validation`, `content-validators`, `identifier-sale-validation`, `leader-workbench-validation`
