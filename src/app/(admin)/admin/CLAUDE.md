[Root](../../../CLAUDE.md) > [src](../../) > [app](../) > **(admin)/admin**

# Admin Pages Module

## Module Purpose

Admin dashboard for managing members, sales records, identifier codes, prospect leads, commission rules, groups, insights, settlements, banners, and announcements. Only accessible by users with `ADMIN` role.

## Sub-pages (10)

| Page | Path | Actions | Description |
|------|------|---------|-------------|
| Dashboard | `/admin` | - | Admin home with daily rhythm summary + cumulative stats |
| Announcements | `/admin/announcements` | create, toggle status/pin | Manage system announcements |
| Banners | `/admin/banners` | create quote, update settings, toggle, import hitokoto | Banner quote and display mode management |
| Codes | `/admin/codes` | import codes/prospects, assign codes/leads | Identifier code + prospect lead management |
| Commission Rules | `/admin/commission-rules` | create rule | Member commission rate management |
| Groups | `/admin/groups` | create/update group | Team group management |
| Insights | `/admin/insights` | adjust target, send reminder | AI-driven member risk analysis + interventions |
| Members | `/admin/members` | create/update member | User account management |
| Sales | `/admin/sales` | review (approve/reject), update record | Daily sales review workflow |
| Settlements | `/admin/settlements` | - | Commission settlement reports with Excel export |

## Entry and Startup

Each sub-page is a React Server Component (`page.tsx`) that fetches data via service functions. Actions are defined in co-located `actions.ts` files. Form state types in `form-state.ts`.

## External Interface

All mutations via Server Actions (no API routes). Excel exports via API routes at `/api/export/`.

## Key Dependencies

- Service layer: `admin-insights-service`, `admin-code-service`, `daily-rhythm-service`, `sales-service`, `settlement-service`, `commission-service`, `group-service`, `banner-service`, `announcement-service`, `member-reminder-service`
- Cache: `leaderboard-cache`, `shell-content-cache`
- Validators: `sales`, `commission`, `member`, `group`, `banner`, `announcement`, `codes`, `reminder`, `target`

## Components

25 admin-specific components in `src/components/admin/`:
- Tables: `member-table`, `sales-table`, `settlement-table`, `group-table`, `announcement-table`, `banner-table`, `commission-rule-table`, `code-inventory-table`, `prospect-lead-table`
- Forms: `member-form`, `group-form`, `announcement-form`, `banner-form`, `banner-settings-form`, `commission-rule-form`, `admin-reminder-form`, `admin-target-adjust-form`
- Panels: `admin-insights-overview`, `admin-insight-member-card`, `admin-daily-review-summary`, `admin-cumulative-stats-panel`, `code-assignment-panel`
- Import: `code-import-card`, `prospect-import-card`, `banner-import-card`

## Tests

Unit tests in `tests/unit/`: `admin-insights-actions`, `admin-insights-service`, `admin-sales-management`, `admin-sales-review-actions`, `admin-code-service`, `admin-codes-actions`, `admin-codes-page`, `admin-groups-page`, `admin-insights-page`, `admin-sales-page`, `admin-daily-review-summary`, `admin-import-cards`, `banner-import-actions`

E2E tests: `admin-insights.spec.ts`, `admin-settlement.spec.ts`, `content-publishing.spec.ts`
