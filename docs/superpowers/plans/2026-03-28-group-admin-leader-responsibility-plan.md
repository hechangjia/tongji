# Group Admin / Leader Responsibility Shift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admins only create groups and appoint leaders, while leaders maintain their own group's slogan and remark.

**Architecture:** Keep the existing `Group` model and admin leader-assignment flow, but remove admin-side editing of `slogan` / `remark`. Add a dedicated leader-side update action and leader-page form that can only edit the current leader's bound group.

**Tech Stack:** Next.js 16 App Router, Server Actions, Prisma, Zod, Vitest

---

## 1. File Map

### Docs

- Create: `docs/superpowers/specs/2026-03-28-group-admin-leader-responsibility-design.md`
- Create: `docs/superpowers/plans/2026-03-28-group-admin-leader-responsibility-plan.md`

### Admin Groups

- Modify: `src/components/admin/group-form.tsx` — admin create form only keeps name + optional leader
- Modify: `src/components/admin/group-table.tsx` — remove admin slogan/remark editing, keep leader assignment
- Modify: `src/app/(admin)/admin/groups/page.tsx` — update page copy and notice tone parsing

### Leader Group

- Modify: `src/lib/validators/group.ts` — add dedicated leader-side group profile update schema
- Modify: `src/app/(leader)/leader/group/page.tsx` — render editable leader-managed group profile form
- Create: `src/app/(leader)/leader/group/actions.ts` — leader-only group profile update action

### Tests

- Modify: `tests/unit/group-management.test.ts`
- Modify: `tests/unit/admin-groups-page.test.tsx`
- Modify: `tests/unit/leader-pages.test.tsx`
- Create: `tests/unit/leader-group-actions.test.ts`

## 2. Task Breakdown

### Task 1: Lock the new admin-side boundary in tests

**Files:**
- Modify: `tests/unit/admin-groups-page.test.tsx`
- Modify: `tests/unit/group-management.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- admin groups page no longer renders slogan/remark edit controls
- admin create form only exposes group name + leader selection

- [ ] **Step 2: Run test to verify it fails**

Run:
`npm test -- tests/unit/admin-groups-page.test.tsx tests/unit/group-management.test.ts`

- [ ] **Step 3: Implement minimal admin UI changes**

Update the admin groups form/table so the admin only creates groups and appoints leaders.

- [ ] **Step 4: Re-run tests**

Run:
`npm test -- tests/unit/admin-groups-page.test.tsx tests/unit/group-management.test.ts`

### Task 2: Add leader-side group profile editing contracts

**Files:**
- Modify: `src/lib/validators/group.ts`
- Create: `src/app/(leader)/leader/group/actions.ts`
- Create: `tests/unit/leader-group-actions.test.ts`

- [ ] **Step 1: Write failing leader action tests**

Cover:
- leader with group can update slogan + remark
- leader without group is rejected
- non-leader / unauthenticated callers are redirected

- [ ] **Step 2: Run test to verify it fails**

Run:
`npm test -- tests/unit/leader-group-actions.test.ts`

- [ ] **Step 3: Implement minimal leader action + validator**

Add a leader-only server action that updates only `slogan` and `remark` for the caller's current group.

- [ ] **Step 4: Re-run tests**

Run:
`npm test -- tests/unit/leader-group-actions.test.ts`

### Task 3: Upgrade `/leader/group` from read-only to editable

**Files:**
- Modify: `src/app/(leader)/leader/group/page.tsx`
- Modify: `tests/unit/leader-pages.test.tsx`

- [ ] **Step 1: Write failing page tests**

Cover:
- leader group page renders editable fields when leader has a bound group
- page still renders empty state when no group is bound

- [ ] **Step 2: Run test to verify it fails**

Run:
`npm test -- tests/unit/leader-pages.test.tsx`

- [ ] **Step 3: Implement page changes**

Render the edit form on `/leader/group` and wire it to the new leader action.

- [ ] **Step 4: Re-run tests**

Run:
`npm test -- tests/unit/leader-pages.test.tsx`

### Task 4: Full verification

**Files:**
- Modify: any touched files above only if verification exposes regressions

- [ ] **Step 1: Run focused verification**

Run:
`npm test -- tests/unit/admin-groups-page.test.tsx tests/unit/group-management.test.ts tests/unit/leader-group-actions.test.ts tests/unit/leader-pages.test.tsx`

- [ ] **Step 2: Run lint and typecheck for touched files**

Run:
`npx eslint 'src/app/(admin)/admin/groups/page.tsx' 'src/components/admin/group-form.tsx' 'src/components/admin/group-table.tsx' 'src/lib/validators/group.ts' 'src/app/(leader)/leader/group/page.tsx' 'src/app/(leader)/leader/group/actions.ts' tests/unit/admin-groups-page.test.tsx tests/unit/group-management.test.ts tests/unit/leader-group-actions.test.ts tests/unit/leader-pages.test.tsx`

Run:
`npx tsc --noEmit`
