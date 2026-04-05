[Root](../../CLAUDE.md) > [src](../) > [app](../) > **(member)**

# Member Pages Module

## Module Purpose

Sales entry and personal records for `MEMBER` role (also accessible by `ADMIN`). Members submit daily sales counts or identifier-code-based sales, view personal records, and receive insights (target feedback, trend summary, reminders).

## Sub-pages (2)

| Page | Path | Actions | Description |
|------|------|---------|-------------|
| Entry | `/entry` | submit sales, submit identifier sale | Sales entry form with insights sidebar |
| Records | `/records` | - | Personal sales record history |

## Entry and Startup

`/entry` page renders a client-side sales entry form (`sales-entry-page-client.tsx`) plus server-fetched insights (daily target, self-trend, reminders, daily rhythm). The entry page detects whether the member has identifier sales and shows appropriate UI.

## External Interface

- `submitSalesEntry` action -- creates/updates SalesRecord
- `submitIdentifierSale` action -- creates IdentifierSale + closes follow-up items
- Both actions call `refreshLeaderboardCaches()` + `refreshEntryInsightsCache()` after mutation

## Key Services

- `sales-service.ts` -- sales record CRUD
- `member-identifier-sale-service.ts` -- identifier sale workspace + submission
- `daily-target-service.ts` -- target feedback + self-trend
- `daily-rhythm-service.ts` -- member daily rhythm summary
- `member-reminder-service.ts` -- recent reminders
- `entry-insights-cache.ts` -- cached insights
- `member-records-cache.ts` -- cached records

## Components

- `sales-entry-form` -- legacy count-based sales form
- `sales-entry-page-client` -- client wrapper with form state management
- `sales-entry-success-card` -- success feedback after submission
- `member-identifier-sale-form` -- identifier code sale form
- `member-identifier-sale-history` -- recent identifier sale list
- `entry-daily-target-card` -- daily target progress display
- `entry-daily-rhythm-summary` -- daily rhythm status
- `entry-self-trend-summary` -- self-trend analysis
- `entry-reminder-list` -- recent reminders display
- `my-records-table` -- personal records table

## Tests

Unit: `sales-entry-action`, `sales-entry-page-client`, `member-actions`, `member-identifier-entry-action`, `member-identifier-sale-service`, `member-records-query`, `entry-page`, `records-page`, `entry-daily-rhythm-summary`, `entry-daily-target-card`, `entry-reminder-list`, `sales-entry-success-card`

E2E: `member-entry.spec.ts`
