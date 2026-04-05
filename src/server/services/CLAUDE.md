[Root](../../CLAUDE.md) > [src](../) > [server](../) > **services**

# Service Layer

## Module Purpose

All business logic resides here. No direct ORM calls should exist in Server Actions, components, or API routes -- they must call service functions instead.

## Entry Points

Every service module exports named functions. There is no single entry file; services are imported individually by actions and API routes.

## Service Catalog (24 modules)

### Sales Domain
| Service | Description |
|---------|-------------|
| `sales-service.ts` | Sales record CRUD, date utilities, `DateValue` type, admin sales queries |
| `sales-reporting-service.ts` | Aggregates IdentifierSale + legacy SalesRecord into unified `AggregatedSalesDayRow` |
| `member-identifier-sale-service.ts` | Member identifier sale workspace, sale submission with prospect lead + follow-up closure |
| `settlement-service.ts` | Commission settlement calculation across date ranges with rule matching |
| `commission-service.ts` | Commission rule CRUD with overlap detection |

### Leaderboard Domain
| Service | Description |
|---------|-------------|
| `leaderboard-service.ts` | Daily/range leaderboard ranking from aggregated sales |
| `group-leaderboard-service.ts` | Group-level leaderboard with viewer delta, member expansion for admin/leader |
| `cumulative-sales-stats-service.ts` | Cumulative ranking, trend series with day/month granularity |

### Admin Domain
| Service | Description |
|---------|-------------|
| `admin-insights-service.ts` | Risk scoring, anomaly detection, daily target auto-generation |
| `admin-code-service.ts` | Identifier code/prospect lead import (xlsx/csv), assignment to users |
| `daily-rhythm-service.ts` | Daily top-3 tracking, review status workflow, admin/member summaries |
| `daily-target-service.ts` | AI-suggested daily targets, member self-trend analysis |
| `member-reminder-service.ts` | Template-based reminder creation and listing |
| `default-user-seed.ts` | Idempotent seed for default admin + member users |

### Leader Domain
| Service | Description |
|---------|-------------|
| `leader-workbench-service.ts` | Full workbench snapshot (members, codes, follow-ups, audit) + mutations |
| `group-service.ts` | Group listing, leader candidate queries |

### Content Domain
| Service | Description |
|---------|-------------|
| `banner-service.ts` | Banner quote management, random/rotate display logic |
| `announcement-service.ts` | Announcement CRUD, visibility filtering, pin management |
| `hitokoto-service.ts` | External Hitokoto API integration for banner import |
| `export-service.ts` | ExcelJS workbook buffer generation for Excel exports |

### Cache Layer (4 modules)
| Service | Description |
|---------|-------------|
| `leaderboard-cache.ts` | Caches leaderboard, rhythm, trend, group, workbench data (30s TTL) |
| `shell-content-cache.ts` | Caches banner + announcement data (60s TTL) |
| `entry-insights-cache.ts` | Caches member target feedback + trend + reminders (30s TTL) |
| `member-records-cache.ts` | Caches member sales records (30s TTL) |

## Key Patterns

- **Aggregation priority**: `sales-reporting-service` merges IdentifierSale (priority) with legacy SalesRecord per user-day key
- **Transactions**: All leader workbench mutations use `db.$transaction()` with audit before/after snapshots
- **Cache invalidation**: Each cache module exports a `refresh*()` function that calls `updateTag()`
- **DateValue brand**: `YYYY-MM-DD` string type used throughout; conversion via `saleDateValueToDate()` / `saleDateToValue()`
- **Lazy cache init**: `getCachedGroupLeaderboard` and `getCachedLeaderWorkbenchSnapshot` use lazy `unstable_cache` initialization with dynamic import to avoid circular deps

## Dependencies

- All services import `db` from `@/lib/db`
- Validators from `@/lib/validators/*`
- Cache modules import `unstable_cache`, `updateTag`, `revalidatePath` from `next/cache`

## Tests

71 unit test files in `tests/unit/` cover nearly all services. Service tests mock `db` at the Prisma client boundary.

## Related Files

- `src/lib/db.ts` -- PrismaClient singleton
- `src/lib/validators/` -- all Zod schemas
- `prisma/schema.prisma` -- data model definitions
- `tests/unit/` -- corresponding test files
