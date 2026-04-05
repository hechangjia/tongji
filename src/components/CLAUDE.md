[Root](../../CLAUDE.md) > [src](../) > **components**

# UI Components Module

## Module Purpose

All React components used across the application. Organized into admin-specific (`admin/`), leader-specific (`leader/`), and shared components at the root level.

## Component Inventory

### Admin Components (25) -- `src/components/admin/`

**Tables**: `member-table`, `sales-table`, `settlement-table`, `group-table`, `announcement-table`, `banner-table`, `commission-rule-table`, `code-inventory-table`, `prospect-lead-table`

**Forms**: `member-form`, `group-form`, `announcement-form`, `banner-form`, `banner-settings-form`, `commission-rule-form`, `admin-reminder-form`, `admin-target-adjust-form`

**Panels/Cards**: `admin-insights-overview`, `admin-insight-member-card`, `admin-daily-review-summary`, `admin-cumulative-stats-panel`, `code-assignment-panel`

**Import Cards**: `code-import-card`, `prospect-import-card`, `banner-import-card`

### Leader Components (6) -- `src/components/leader/`

`leader-member-ranking-panel`, `leader-group-ranking-panel`, `leader-follow-up-section`, `leader-code-assignment-section`, `leader-audit-timeline`, `group-leaderboard-table`

### Shared Components (27) -- `src/components/`

**Shell**: `app-shell` (server), `app-shell-client` (client), `app-monitoring` (Vercel analytics/speed-insights)

**Entry UI**: `sales-entry-form`, `sales-entry-page-client`, `sales-entry-success-card`, `member-identifier-sale-form`, `member-identifier-sale-history`

**Insights**: `entry-daily-target-card`, `entry-daily-rhythm-summary`, `entry-self-trend-summary`, `entry-reminder-list`

**Leaderboard**: `leaderboard-table`, `daily-top3-strip`, `cumulative-ranking-chart`, `cumulative-trend-chart`

**Content**: `announcement-list`, `banner-rotator`, `page-header`, `metric-card`, `empty-state`, `status-callout`

**Auth**: `login-form`, `register-form`

**Theme**: `theme-script` (SSR bootstrap), `theme-palette` (theme picker)

**Records**: `my-records-table`

## Key Patterns

- Server components by default; `'use client'` only where interactivity required
- Form components use `useActionState` for Server Action integration
- Charts are client components using inline SVG rendering
- Shell components handle layout (sidebar navigation, breadcrumb, banner, announcements)
- All data fetching happens in page server components, passed as props to client components

## Tests

Component unit tests: `app-shell`, `app-shell-smoke`, `leaderboard-table`, `daily-top3-strip`, `cumulative-ranking-chart`, `cumulative-trend-chart`, `entry-daily-rhythm-summary`, `entry-daily-target-card`, `entry-reminder-list`, `sales-entry-success-card`, `sales-entry-page-client`, `theme-palette`, `root-layout`, `admin-daily-review-summary`, `admin-import-cards`
