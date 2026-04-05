[Root](../../../../CLAUDE.md) > [src](../../../) > [app](../../) > **(shared)/leaderboard**

# Shared Leaderboard Pages

## Module Purpose

Public leaderboard pages accessible by all authenticated roles. Displays daily rankings, cumulative range rankings, and group-level leaderboards.

## Sub-pages (3)

| Page | Path | Description |
|------|------|-------------|
| Daily | `/leaderboard/daily` | Today's sales leaderboard with top-3 strip |
| Range | `/leaderboard/range` | Cumulative leaderboard with ranking chart + trend chart |
| Groups | `/leaderboard/groups` | Group-level leaderboard with drill-down member rows |

## Key Services

- `leaderboard-service.ts` -- `getDailyLeaderboard`, `getRangeLeaderboard`
- `group-leaderboard-service.ts` -- `getGroupLeaderboard`, `getVisibleGroupMemberRows`
- `cumulative-sales-stats-service.ts` -- `getMemberCumulativeRanking`, `getAdminCumulativeTrend`
- `leaderboard-cache.ts` -- all cached variants (30s TTL)

## Components

- `leaderboard-table` -- reusable ranking table
- `daily-top3-strip` -- top-3 highlight strip
- `cumulative-ranking-chart` -- ranking bar chart
- `cumulative-trend-chart` -- trend line chart
- `group-leaderboard-table` -- group-level leaderboard

## Tests

Unit: `leaderboard-service`, `leaderboard-cache`, `leaderboard-actions-revalidation`, `leaderboard-table`, `shared-daily-leaderboard-page`, `shared-range-leaderboard-page`, `daily-top3-strip`, `cumulative-ranking-chart`, `cumulative-trend-chart`, `group-leaderboard-service`

E2E: `cumulative-stats.spec.ts`
