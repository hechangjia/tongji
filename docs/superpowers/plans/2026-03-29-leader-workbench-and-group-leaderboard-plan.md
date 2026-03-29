# Leader Workbench and Group Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/leader/sales` and `/leaderboard/groups` placeholders with a real leader workbench, group leaderboard, in-group reassignment flow, and strong audit trail without breaking the existing `IdentifierSale -> SalesRecord` bridge.

**Architecture:** Add two new process models: `GroupFollowUpItem` for leader-visible follow-up work and `GroupResourceAuditLog` for immutable audit history. Build a read/write `leader-workbench-service` plus a separate `group-leaderboard-service`, then wire them into `/leader/sales`, `/leaderboard/groups`, admin code assignment, and the member identifier-sale flow so assigned prospects and completed sales stay in sync with the new workbench state.

**Tech Stack:** Next.js 16 App Router, Prisma, PostgreSQL, Server Actions, Zod, Vitest, Playwright

**Status:** Implemented in the workspace on 2026-03-29. Checklist backfilled after code, tests, and smoke coverage landed.

---

## 1. File Map

### Preflight

- Read the AGENTS note before code changes: this repo expects the relevant Next.js 16 bundled docs under `node_modules/next/dist/docs/`.
- In this workspace snapshot, `node_modules/next/dist/docs/` is currently missing. If it is still absent at execution time, run `npm install` first so the executor can read the local Next.js docs before touching App Router / Server Action code.

### Database / Contracts

- Modify: `prisma/schema.prisma` — add the new workbench enums/models and group ownership on `IdentifierCode`
- Create: `prisma/migrations/20260329183000_add_leader_workbench_and_group_leaderboard/migration.sql`
- Modify: `tests/unit/prisma-schema-contract.test.ts` — lock the new schema contract

### Validation

- Create: `src/lib/validators/leader-workbench.ts` — leader mutation schemas for manual follow-up creation, follow-up reassignment, follow-up status updates, and code reassignment
- Modify: `src/lib/validators/identifier-sale.ts` — add optional `followUpItemId` so member sales can explicitly close a workbench item
- Create: `tests/unit/leader-workbench-validation.test.ts`
- Modify: `tests/unit/identifier-sale-validation.test.ts`

### Service Layer

- Create: `src/server/services/group-leaderboard-service.ts` — group-level aggregation, ranking, adjacent-rank deltas, and permission-aware member-detail expansion
- Create: `src/server/services/leader-workbench-service.ts` — leader dashboard reads, manual follow-up creation, in-group reassignment, status transitions, and audit writes
- Modify: `src/server/services/leaderboard-cache.ts` — cache group leaderboard / leader workbench reads and revalidation helpers
- Modify: `src/server/services/admin-code-service.ts` — persist group ownership on code assignment and create/update follow-up items for assigned prospects
- Modify: `src/server/services/member-identifier-sale-service.ts` — mark linked follow-up items as converted when sales complete
- Create: `tests/unit/group-leaderboard-service.test.ts`
- Create: `tests/unit/leader-workbench-service.test.ts`
- Create: `tests/unit/leader-workbench-mutations.test.ts`
- Modify: `tests/unit/admin-code-service.test.ts`
- Modify: `tests/unit/member-identifier-sale-service.test.ts`

### Leader Workbench UI / Actions

- Create: `src/app/(leader)/leader/sales/actions.ts` — leader-only server actions for creating manual follow-up items, reassigning follow-up items, updating follow-up status, and reassigning codes
- Modify: `src/app/(leader)/leader/sales/page.tsx` — replace placeholder with the real workbench
- Create: `src/components/leader/leader-member-ranking-panel.tsx`
- Create: `src/components/leader/leader-group-ranking-panel.tsx`
- Create: `src/components/leader/leader-follow-up-section.tsx`
- Create: `src/components/leader/leader-code-assignment-section.tsx`
- Create: `src/components/leader/leader-audit-timeline.tsx`
- Create: `tests/unit/leader-sales-actions.test.ts`
- Modify: `tests/unit/leader-pages.test.tsx`

### Shared Group Leaderboard / Member Bridge

- Create: `src/components/leader/group-leaderboard-table.tsx`
- Modify: `src/app/(shared)/leaderboard/groups/page.tsx` — render group standings and role-aware member-detail expansion
- Modify: `src/app/(member)/entry/actions.ts` — pass optional `followUpItemId` into member sale saves
- Modify: `src/app/(member)/entry/form-state.ts` — keep the optional follow-up linkage in action state
- Modify: `src/app/(member)/entry/page.tsx` — accept optional `followUpItemId` query state so workbench-provided entry links can preserve context
- Modify: `src/components/member-identifier-sale-form.tsx` — keep an optional hidden `followUpItemId`
- Modify: `tests/unit/member-identifier-entry-action.test.ts`
- Modify: `tests/unit/entry-page.test.tsx`

### Docs / E2E

- Modify: `README.md` — replace the placeholder description for leader sales and group leaderboard with the new current state
- Modify: `docs/ai/handoff.md` — document the new workbench flow, audit model, and remaining post-workbench gaps
- Create: `tests/e2e/leader-workbench.spec.ts` — smoke test leader login, group leaderboard visibility, and at least one in-group mutation path

## 2. Execution Notes

- Keep the scope tight. This plan does not include settlement rewrites, cross-group dispatch, or rollback flows.
- Reuse the current pattern where route pages stay server-side and the mutation logic lives in server actions plus focused services.
- `IdentifierSale` remains the final source of truth for completed sales. The new workbench models are process-state helpers, not replacements for `IdentifierSale` or `ProspectLead`.
- `ProspectLeadStatus` should stay coarse (`UNASSIGNED / ASSIGNED / CONVERTED`). Fine-grained workbench progress belongs on `GroupFollowUpItem.status`.
- `IdentifierCode.status` should not grow a new “group pool” enum. The group pool is represented by `assignedGroupId` being set while `currentOwnerUserId` is `null` and `status` stays `ASSIGNED`.
- Every heavy mutation must append an immutable audit row with a required reason.
- Leader permission stays strictly in-group. If a service method needs both `leaderUserId` and `groupId`, derive the group from the leader inside the service instead of trusting caller input.

## 3. Task Breakdown

### Task 1: Lock the new schema contract for workbench state and audit history

**Files:**
- Modify: `tests/unit/prisma-schema-contract.test.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260329183000_add_leader_workbench_and_group_leaderboard/migration.sql`

- [x] **Step 1: Write the failing schema contract test**

Add assertions for:
- `enum GroupFollowUpSourceType`
- `enum GroupFollowUpStatus`
- `enum GroupResourceAuditResourceType`
- `enum GroupResourceAuditActionType`
- `assignedGroupId String?` on `IdentifierCode`
- `model GroupFollowUpItem`
- `model GroupResourceAuditLog`
- `Json` snapshots on the audit model

- [x] **Step 2: Run the contract test to verify it fails**

Run:
`npm test -- tests/unit/prisma-schema-contract.test.ts`

Expected:
- FAIL because the new enums, models, and `assignedGroupId` field do not exist yet.

- [x] **Step 3: Add the minimal Prisma schema and SQL migration**

Implement:
- `IdentifierCode.assignedGroupId` with a nullable relation to `Group`
- `GroupFollowUpSourceType` with:
  - `PROSPECT_LEAD`
  - `MANUAL_DISCOVERY`
- `GroupFollowUpStatus` with:
  - `UNTOUCHED`
  - `FOLLOWING_UP`
  - `APPOINTED`
  - `READY_TO_CONVERT`
  - `INVALID`
  - `CONVERTED`
- `GroupResourceAuditResourceType` with:
  - `FOLLOW_UP_ITEM`
  - `PROSPECT_LEAD`
  - `IDENTIFIER_CODE`
- `GroupResourceAuditActionType` with:
  - `CREATE_MANUAL_FOLLOW_UP`
  - `REASSIGN`
  - `RETURN_TO_GROUP_POOL`
  - `STATUS_CHANGE`
  - `CONVERTED_LINKED`
- `GroupFollowUpItem` fields:
  - `groupId`
  - `currentOwnerUserId`
  - `sourceType`
  - `prospectLeadId`
  - `status`
  - `summaryNote`
  - `createdByUserId`
  - `lastActionAt`
  - `convertedAt`
  - timestamps
- `GroupResourceAuditLog` fields:
  - `groupId`
  - `operatorUserId`
  - `resourceType`
  - `resourceId`
  - `actionType`
  - `beforeSnapshot`
  - `afterSnapshot`
  - `reason`
  - `createdAt`
- indexes for:
  - `IdentifierCode.assignedGroupId + status`
  - `GroupFollowUpItem.groupId + status + lastActionAt`
  - `GroupFollowUpItem.currentOwnerUserId + status`
  - `GroupResourceAuditLog.groupId + createdAt`

- [x] **Step 4: Re-run schema validation**

Run:
- `npm test -- tests/unit/prisma-schema-contract.test.ts`
- `npm run prisma:validate`

Expected:
- PASS

### Task 2: Lock validation contracts for leader workbench mutations

**Files:**
- Create: `src/lib/validators/leader-workbench.ts`
- Create: `tests/unit/leader-workbench-validation.test.ts`
- Modify: `src/lib/validators/identifier-sale.ts`
- Modify: `tests/unit/identifier-sale-validation.test.ts`

- [x] **Step 1: Write the failing validator tests**

Cover:
- manual follow-up creation requires `summaryNote` and allows an empty owner for the group pool
- follow-up reassignment requires `followUpItemId` and `reason`
- follow-up status updates require `followUpItemId`, `status`, and `reason`
- code reassignment allows an empty `nextOwnerUserId` for “return to group pool” but still requires `reason`
- identifier-sale payload accepts optional `followUpItemId`
- identifier-sale still rejects mixed assigned-lead/manual-input payloads

- [x] **Step 2: Run validator tests to verify they fail**

Run:
`npm test -- tests/unit/leader-workbench-validation.test.ts tests/unit/identifier-sale-validation.test.ts`

Expected:
- FAIL because the new validator file does not exist and `identifierSaleSchema` has no `followUpItemId`.

- [x] **Step 3: Implement the validators**

Add:
- `createManualFollowUpSchema`
- `reassignFollowUpSchema`
- `updateFollowUpStatusSchema`
- `reassignIdentifierCodeSchema`

Update `identifierSaleSchema` so both discriminated branches accept:
- `followUpItemId?: string`

Validation rules:
- trim all reason strings
- reject empty reasons
- reject empty note on manual follow-up creation
- keep existing QQ / major rules unchanged

- [x] **Step 4: Re-run validator tests**

Run:
`npm test -- tests/unit/leader-workbench-validation.test.ts tests/unit/identifier-sale-validation.test.ts`

Expected:
- PASS

### Task 3: Build the read-side leaderboard and workbench services

**Files:**
- Create: `src/server/services/group-leaderboard-service.ts`
- Create: `src/server/services/leader-workbench-service.ts`
- Modify: `src/server/services/leaderboard-cache.ts`
- Create: `tests/unit/group-leaderboard-service.test.ts`
- Create: `tests/unit/leader-workbench-service.test.ts`

- [x] **Step 1: Write the failing service tests**

Cover group leaderboard reads:
- ranks groups by today’s `IdentifierSale` totals first
- preserves `40 / 60` splits
- falls back to legacy aggregated rows only when a user/day has no identifier-sale fact
- returns adjacent-rank deltas for the current leader’s group
- hides member-detail rows from `MEMBER`
- only allows `LEADER` to expand their own group

Cover leader workbench reads:
- rejects a leader account with no bound group
- returns the bound group summary strip
- returns member ranking rows for the leader’s group only
- includes assigned-group codes whose `currentOwnerUserId` is `null`
- merges `PROSPECT_LEAD` and `MANUAL_DISCOVERY` items into one follow-up queue
- orders audit rows newest-first

- [x] **Step 2: Run the service tests to verify they fail**

Run:
`npm test -- tests/unit/group-leaderboard-service.test.ts tests/unit/leader-workbench-service.test.ts`

Expected:
- FAIL because both service files are missing.

- [x] **Step 3: Implement the read-side services and cache helpers**

Implement `group-leaderboard-service.ts` with focused functions:
- `getGroupLeaderboard(input)`
- `getVisibleGroupMemberRows(input)`

Implement `leader-workbench-service.ts` read helpers:
- `getLeaderWorkbenchSnapshot(input)`
- `getLeaderBoundGroupOrThrow(leaderUserId)`

Implementation notes:
- use `getAggregatedSalesDayRows` to preserve the current mixed `IdentifierSale` / `SalesRecord` behavior
- join users to groups when collapsing legacy rows into group totals
- use `assignedGroupId` to pull in-group codes from both member ownership and the group pool
- do not let the page decide permission logic; keep it inside the services

Extend `leaderboard-cache.ts` with:
- `getCachedGroupLeaderboard`
- `getCachedLeaderWorkbenchSnapshot`
- `refreshLeaderWorkbenchCaches`

- [x] **Step 4: Re-run the read-side tests**

Run:
`npm test -- tests/unit/group-leaderboard-service.test.ts tests/unit/leader-workbench-service.test.ts`

Expected:
- PASS

### Task 4: Build the write-side workbench mutations and immutable audit log

**Files:**
- Modify: `src/server/services/leader-workbench-service.ts`
- Create: `tests/unit/leader-workbench-mutations.test.ts`

- [x] **Step 1: Write the failing mutation tests**

Cover:
- leader can create a `MANUAL_DISCOVERY` item in their own group
- leader can reassign a follow-up item inside the same group
- leader can return a follow-up item to the group pool by clearing the owner
- leader can update a follow-up item status but cannot revive `INVALID` or `CONVERTED`
- leader can reassign an `ASSIGNED` code inside the group
- leader can return an `ASSIGNED` code to the group pool
- sold codes reject reassignment
- all successful mutations append exactly one audit row with `beforeSnapshot`, `afterSnapshot`, and `reason`
- non-leader or wrong-group mutations reject

- [x] **Step 2: Run the mutation tests to verify they fail**

Run:
`npm test -- tests/unit/leader-workbench-mutations.test.ts`

Expected:
- FAIL because the mutation helpers and audit writes do not exist.

- [x] **Step 3: Implement the mutation helpers in `leader-workbench-service.ts`**

Add focused functions:
- `createManualFollowUpForLeader`
- `reassignFollowUpForLeader`
- `updateFollowUpStatusForLeader`
- `reassignIdentifierCodeForLeader`

Required transaction behavior:
- resolve the leader’s bound group first
- verify the resource belongs to that group
- reject cross-group writes
- update the target record
- append a `GroupResourceAuditLog` row in the same transaction
- refresh `lastActionAt` on the follow-up item

- [x] **Step 4: Re-run the mutation tests**

Run:
`npm test -- tests/unit/leader-workbench-mutations.test.ts`

Expected:
- PASS

### Task 5: Bridge admin assignment and member sales into the new workbench state

**Files:**
- Modify: `src/server/services/admin-code-service.ts`
- Modify: `src/server/services/member-identifier-sale-service.ts`
- Modify: `src/lib/validators/identifier-sale.ts`
- Modify: `src/app/(member)/entry/actions.ts`
- Modify: `src/app/(member)/entry/form-state.ts`
- Modify: `src/app/(member)/entry/page.tsx`
- Modify: `src/components/member-identifier-sale-form.tsx`
- Modify: `tests/unit/admin-code-service.test.ts`
- Modify: `tests/unit/member-identifier-sale-service.test.ts`
- Modify: `tests/unit/member-identifier-entry-action.test.ts`
- Modify: `tests/unit/entry-page.test.tsx`

- [x] **Step 1: Write the failing integration tests**

Cover admin assignment:
- assigning identifier codes also sets `assignedGroupId`
- assigning prospect leads creates or reopens a `PROSPECT_LEAD` follow-up item for the assignee’s group

Cover member-sale bridge:
- saving a sale with `followUpItemId` marks the linked follow-up item as `CONVERTED`
- sales still create `IdentifierSale`, mark the code `SOLD`, convert the `ProspectLead`, and sync the legacy `SalesRecord`
- member entry action preserves the optional `followUpItemId`
- member entry page can seed that optional linkage from query state without breaking the current form defaults

- [x] **Step 2: Run the integration tests to verify they fail**

Run:
`npm test -- tests/unit/admin-code-service.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx`

Expected:
- FAIL because admin assignments do not create follow-up items, codes do not track group ownership, and member sales do not know about `followUpItemId`.

- [x] **Step 3: Implement the admin / member bridge**

Update `admin-code-service.ts`:
- set `assignedGroupId` when codes are first assigned
- create or upsert a `GroupFollowUpItem` when a prospect lead becomes assigned

Update `member-identifier-sale-service.ts`:
- accept optional `followUpItemId`
- if present, verify it belongs to the seller’s group and move it to `CONVERTED`
- if the sale uses an assigned lead, also close the matching `PROSPECT_LEAD` item

Update the member entry flow:
- carry `followUpItemId` through the action state
- render it as a hidden field in the identifier-sale form
- allow `/entry` to read an optional `followUpItemId` from search params so workbench links can preserve the selected follow-up item

- [x] **Step 4: Re-run the integration tests**

Run:
`npm test -- tests/unit/admin-code-service.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx`

Expected:
- PASS

### Task 6: Replace `/leader/sales` with the real leader workbench

**Files:**
- Create: `src/app/(leader)/leader/sales/actions.ts`
- Modify: `src/app/(leader)/leader/sales/page.tsx`
- Create: `src/components/leader/leader-member-ranking-panel.tsx`
- Create: `src/components/leader/leader-group-ranking-panel.tsx`
- Create: `src/components/leader/leader-follow-up-section.tsx`
- Create: `src/components/leader/leader-code-assignment-section.tsx`
- Create: `src/components/leader/leader-audit-timeline.tsx`
- Create: `tests/unit/leader-sales-actions.test.ts`
- Modify: `tests/unit/leader-pages.test.tsx`

- [x] **Step 1: Write the failing leader page and action tests**

Cover page rendering:
- `/leader/sales` shows the summary strip, member ranking panel, group ranking panel, follow-up queue, code assignment queue, and audit timeline
- leaders with no bound group see a useful empty state instead of a placeholder
- guests redirect to `/login`
- members redirect to `/entry`

Cover actions:
- creating a manual follow-up redirects back with a success notice
- reassigning a follow-up item revalidates `/leader/sales` and `/leaderboard/groups`
- reassigning a code back to the group pool succeeds with a required reason
- unauthenticated or non-leader callers redirect away

- [x] **Step 2: Run the page and action tests to verify they fail**

Run:
`npm test -- tests/unit/leader-sales-actions.test.ts tests/unit/leader-pages.test.tsx`

Expected:
- FAIL because `/leader/sales` is still the placeholder page and the actions file does not exist.

- [x] **Step 3: Implement the page, actions, and focused components**

Implementation requirements:
- keep the route page as a server component
- fetch the snapshot through `getCachedLeaderWorkbenchSnapshot`
- move each major panel into its own component
- use server actions for:
  - creating manual follow-up items
  - reassigning follow-up items
  - updating follow-up status
  - reassigning codes
- after successful mutations, revalidate:
  - `/leader/sales`
  - `/leader/group`
  - `/leaderboard/groups`
  - `/entry` for the affected member when applicable

- [x] **Step 4: Re-run the leader page and action tests**

Run:
`npm test -- tests/unit/leader-sales-actions.test.ts tests/unit/leader-pages.test.tsx`

Expected:
- PASS

### Task 7: Replace `/leaderboard/groups` with a shared, role-aware group leaderboard

**Files:**
- Create: `src/components/leader/group-leaderboard-table.tsx`
- Modify: `src/app/(shared)/leaderboard/groups/page.tsx`
- Modify: `tests/unit/leader-pages.test.tsx`

- [x] **Step 1: Write the failing leaderboard page tests**

Cover:
- anonymous visitors still see the shared page without `AppShell`
- logged-in members see only group totals
- leaders see group totals plus expandable detail for their own group only
- admins can expand any group
- the page summary shows current date or selected range plus adjacent rank context

- [x] **Step 2: Run the leaderboard page tests to verify they fail**

Run:
`npm test -- tests/unit/leader-pages.test.tsx`

Expected:
- FAIL because the current page still renders the “建设中” placeholder.

- [x] **Step 3: Implement the shared leaderboard page**

Requirements:
- preserve the current anonymous rendering pattern
- call `getCachedGroupLeaderboard`
- render one shared table component with role-aware expansion controls
- do not duplicate member-detail permission logic in the component; pass already-filtered data from the service

- [x] **Step 4: Re-run the leaderboard page tests**

Run:
`npm test -- tests/unit/leader-pages.test.tsx`

Expected:
- PASS

### Task 8: Update docs and add a smoke E2E for the new leader flow

**Files:**
- Modify: `README.md`
- Modify: `docs/ai/handoff.md`
- Create: `tests/e2e/leader-workbench.spec.ts`

- [x] **Step 1: Write the failing smoke E2E**

Cover one realistic minimal path:
- self-register a second member account for the test
- sign in as admin and create a group
- appoint `member01` as that group’s leader
- assign at least one identifier code or prospect lead into the group
- sign in as the leader and open `/leader/sales`
- verify the leader workbench sections render
- complete one in-group mutation, such as returning a code or follow-up item to the group pool
- open `/leaderboard/groups` and confirm the shared standings render

- [x] **Step 2: Run the smoke E2E to verify it fails**

Run:
`npm run test:e2e -- tests/e2e/leader-workbench.spec.ts`

Expected:
- FAIL because the workbench UI and mutation path do not exist yet.

- [x] **Step 3: Update docs to match the shipped behavior**

Update `README.md` and `docs/ai/handoff.md` so they say:
- `/leader/sales` is now the leader workbench, not a placeholder
- `/leaderboard/groups` is now a live shared leaderboard
- settlement rewrite and deployment validation remain the next unfinished tracks

- [x] **Step 4: Run focused verification**

Run:
`npm test -- tests/unit/prisma-schema-contract.test.ts tests/unit/leader-workbench-validation.test.ts tests/unit/identifier-sale-validation.test.ts tests/unit/group-leaderboard-service.test.ts tests/unit/leader-workbench-service.test.ts tests/unit/leader-workbench-mutations.test.ts tests/unit/admin-code-service.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/leader-sales-actions.test.ts tests/unit/leader-pages.test.tsx`

Run:
`npm run test:e2e -- tests/e2e/leader-workbench.spec.ts`

Run:
`npx eslint 'src/lib/validators/leader-workbench.ts' 'src/lib/validators/identifier-sale.ts' 'src/server/services/group-leaderboard-service.ts' 'src/server/services/leader-workbench-service.ts' 'src/server/services/leaderboard-cache.ts' 'src/server/services/admin-code-service.ts' 'src/server/services/member-identifier-sale-service.ts' 'src/app/(leader)/leader/sales/actions.ts' 'src/app/(leader)/leader/sales/page.tsx' 'src/app/(shared)/leaderboard/groups/page.tsx' 'src/app/(member)/entry/actions.ts' 'src/app/(member)/entry/form-state.ts' 'src/app/(member)/entry/page.tsx' 'src/components/member-identifier-sale-form.tsx' 'src/components/leader/leader-member-ranking-panel.tsx' 'src/components/leader/leader-group-ranking-panel.tsx' 'src/components/leader/leader-follow-up-section.tsx' 'src/components/leader/leader-code-assignment-section.tsx' 'src/components/leader/leader-audit-timeline.tsx' 'src/components/leader/group-leaderboard-table.tsx' tests/unit/leader-workbench-validation.test.ts tests/unit/identifier-sale-validation.test.ts tests/unit/group-leaderboard-service.test.ts tests/unit/leader-workbench-service.test.ts tests/unit/leader-workbench-mutations.test.ts tests/unit/admin-code-service.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/leader-sales-actions.test.ts tests/unit/leader-pages.test.tsx tests/e2e/leader-workbench.spec.ts`

Run:
`npx tsc --noEmit`

Run:
`npm run build`

Expected:
- all targeted unit tests PASS
- the leader smoke E2E PASSes
- lint, typecheck, and production build PASS
