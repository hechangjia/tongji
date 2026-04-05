[Root](../../../CLAUDE.md) > [src](../../) > [app](../) > **(leader)/leader**

# Leader Pages Module

## Module Purpose

Leader workbench for group management. Leaders can view group member rankings, manage identifier code assignments, track follow-up items, and review audit logs. Accessible by `LEADER` and `ADMIN` roles.

## Sub-pages (2)

| Page | Path | Actions | Description |
|------|------|---------|-------------|
| Group Workbench | `/leader/group` | create follow-up, reassign follow-up, update follow-up status, reassign code | Full group management workbench |
| Sales | `/leader/sales` | submit identifier sale | Leader-scope sales entry via identifier codes |

## Entry and Startup

`/leader/group` page fetches `LeaderWorkbenchSnapshot` -- a composite DTO containing group info, summary metrics, member ranking, code pool, follow-up queue, and audit timeline.

## External Interface

All mutations via Server Actions. Workbench mutations use `db.$transaction()` with audit logging.

## Key Services

- `leader-workbench-service.ts` -- workbench snapshot, follow-up CRUD, code reassignment
- `group-leaderboard-service.ts` -- group-level leaderboard
- `member-identifier-sale-service.ts` -- identifier sale submission
- `leaderboard-cache.ts` -- cached workbench snapshot + group leaderboard

## Validators

- `leader-workbench.ts` -- schemas for follow-up creation, reassignment, status update, code reassignment

## Components

6 leader-specific components in `src/components/leader/`:
- `leader-member-ranking-panel` -- member sales ranking within group
- `leader-group-ranking-panel` -- group ranking overview
- `leader-follow-up-section` -- follow-up item management
- `leader-code-assignment-section` -- code pool management
- `leader-audit-timeline` -- resource audit log display
- `group-leaderboard-table` -- group leaderboard display

## Tests

Unit: `leader-group-actions`, `leader-sales-actions`, `leader-workbench-service`, `leader-workbench-mutations`, `leader-workbench-validation`, `group-leaderboard-service`, `leader-pages`

E2E: `leader-workbench.spec.ts`
