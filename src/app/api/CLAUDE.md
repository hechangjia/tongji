[Root](../../CLAUDE.md) > [src](../) > [app](../) > **api**

# API Routes Module

## Module Purpose

Read-only API endpoints for data export (Excel) and the Auth.js handler. All mutation operations go through Server Actions, not API routes.

## Routes (4)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Public | Auth.js v5 handler (login, session, callbacks) |
| `/api/export/daily` | GET | ADMIN | Export daily leaderboard as `.xlsx` |
| `/api/export/range` | GET | ADMIN | Export range leaderboard as `.xlsx` |
| `/api/export/settlement` | GET | ADMIN | Export settlement report as `.xlsx` |

## Auth Guard

All export endpoints check `auth()` session + `canAccessAdmin()` permission. Return 401/403 for unauthorized requests.

## Key Patterns

- All routes set `export const dynamic = "force-dynamic"` to prevent caching
- Query parameters: `date` (daily), `startDate`/`endDate` (range, settlement)
- Date validation via regex `^\d{4}-\d{2}-\d{2}$`, falls back to today
- Response: binary Excel buffer with `Content-Disposition: attachment` headers
- Uses `buildWorkbookBuffer()` from `export-service.ts` (ExcelJS)
- Column headers are in Chinese (e.g., "排名", "成员", "40套餐")

## Dependencies

- `src/lib/auth.ts` -- session retrieval
- `src/lib/permissions.ts` -- `canAccessAdmin`
- `src/server/services/export-service.ts` -- Excel generation
- `src/server/services/leaderboard-service.ts` -- daily/range data
- `src/server/services/settlement-service.ts` -- settlement data
- `src/server/services/sales-service.ts` -- date utilities

## Tests

Unit: `export-service`

E2E: covered indirectly via admin settlement and leaderboard tests
