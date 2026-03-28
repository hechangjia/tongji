# Member Identifier Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade member routes so members can sell their assigned identifier codes with `40 / 60` plan types while keeping the old daily summary flow alive as a bridge.

**Architecture:** Add a new `IdentifierSale` fact model plus prospect-lead source metadata, then build a focused member-side sale service that writes the new fact and synchronizes the old `SalesRecord` day summary. `/entry` becomes a dual-track workspace: the new identifier sale flow is primary, while the legacy daily summary form remains as a guarded fallback for dates that have no identifier-sale facts.

**Tech Stack:** Next.js 16 App Router, Prisma, PostgreSQL, Server Actions, Zod, Vitest

---

## 1. File Map

### Database / Contracts

- Modify: `prisma/schema.prisma` — add `ProspectLeadSourceType`, extend `ProspectLeadStatus`, add `PlanType` and `IdentifierSale`
- Create: `prisma/migrations/<timestamp>_add_member_identifier_sales/migration.sql`
- Modify: `tests/unit/prisma-schema-contract.test.ts` — lock the new enums/models/optional prospect batch relation

### Validation / Service Layer

- Create: `src/lib/validators/identifier-sale.ts` — member identifier sale form validation
- Create: `tests/unit/identifier-sale-validation.test.ts`
- Create: `src/server/services/member-identifier-sale-service.ts` — member workspace reads, identifier sale writes, legacy summary sync
- Create: `tests/unit/member-identifier-sale-service.test.ts`
- Modify: `src/server/services/admin-code-service.ts` — tolerate manually-created leads with no import batch
- Modify: `tests/unit/admin-code-service.test.ts`
- Modify: `src/server/services/sales-service.ts` — block legacy daily save when identifier-sale facts already exist for that user/day
- Modify: `tests/unit/sales-service.test.ts`

### Member Entry / Records UI

- Modify: `src/app/(member)/entry/actions.ts` — add identifier-sale action alongside existing legacy save action
- Modify: `src/app/(member)/entry/form-state.ts` — add identifier workspace/action summary contracts
- Modify: `src/app/(member)/entry/page.tsx` — fetch member workspace payload
- Modify: `src/components/sales-entry-page-client.tsx` — render the new primary sale flow and the legacy fallback
- Create: `src/components/member-identifier-sale-form.tsx` — new identifier sale form
- Create: `src/components/member-identifier-sale-history.tsx` — lightweight recent-sale list for the workspace sidebar/body
- Modify: `src/app/(member)/records/page.tsx` — read identifier sale history in addition to legacy daily summaries
- Modify: `src/components/my-records-table.tsx` — render identifier-level metadata
- Create: `tests/unit/member-identifier-entry-action.test.ts`
- Modify: `tests/unit/entry-page.test.tsx`
- Modify: `tests/unit/sales-entry-action.test.ts`
- Modify: `tests/unit/records-page.test.tsx`

## 2. Execution Notes

- Keep the old `/entry` daily summary save path intact, but mark it as fallback-only.
- Hard rule: if a user already has any `IdentifierSale` on a given date, the legacy daily save path for that date must reject writes.
- Manual member-entered leads must be deduped by `qqNumber`. Reuse existing leads when possible.
- If a reused lead is already assigned to a different user and not yet converted, reject the sale instead of silently stealing it.
- `IdentifierSale` is the new fact table. `SalesRecord` becomes a synchronized compatibility aggregate.
- `ProspectLead.importBatchId` must become optional so member-manual leads can exist without fake import batches.

## 3. Task Breakdown

### Task 1: Lock new schema contract for member-side identifier sales

**Files:**
- Modify: `tests/unit/prisma-schema-contract.test.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_member_identifier_sales/migration.sql`

- [ ] **Step 1: Write the failing schema contract test**

Add assertions for:
- `enum PlanType`
- `enum ProspectLeadSourceType`
- `CONVERTED` inside `ProspectLeadStatus`
- `model IdentifierSale`
- `importBatchId String?` on `ProspectLead`
- `sourceType ProspectLeadSourceType`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/prisma-schema-contract.test.ts`
Expected: FAIL because the member-sale schema pieces do not exist yet.

- [ ] **Step 3: Add minimal Prisma schema and migration**

Implement the new enums/model and prospect-lead adjustments.

- [ ] **Step 4: Re-run contract test and Prisma validation**

Run:
- `npm test -- tests/unit/prisma-schema-contract.test.ts`
- `npm run prisma:validate`
Expected: PASS

### Task 2: Lock identifier-sale validation with TDD

**Files:**
- Create: `src/lib/validators/identifier-sale.ts`
- Create: `tests/unit/identifier-sale-validation.test.ts`

- [ ] **Step 1: Write failing validator tests**

Cover:
- identifier sale requires code id + plan type
- choosing existing lead requires `prospectLeadId`
- choosing manual lead requires `qqNumber` + `major`
- invalid mixed payloads reject

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/identifier-sale-validation.test.ts`
Expected: FAIL because the validator file does not exist.

- [ ] **Step 3: Implement minimal validator**

Add a single schema with a discriminated source mode:
- `ASSIGNED_LEAD`
- `MANUAL_INPUT`

- [ ] **Step 4: Re-run validator tests**

Run: `npm test -- tests/unit/identifier-sale-validation.test.ts`
Expected: PASS

### Task 3: Build member identifier-sale service and legacy summary bridge

**Files:**
- Create: `src/server/services/member-identifier-sale-service.ts`
- Create: `tests/unit/member-identifier-sale-service.test.ts`
- Modify: `src/server/services/admin-code-service.ts`
- Modify: `tests/unit/admin-code-service.test.ts`
- Modify: `src/server/services/sales-service.ts`
- Modify: `tests/unit/sales-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Cover:
- members can only sell their own assigned non-sold identifier codes
- assigned prospect leads must belong to the current member and not be converted
- manual QQ input creates or reuses a lead
- reusing a QQ assigned to another member is rejected
- creating an identifier sale syncs the day’s legacy `SalesRecord`
- legacy save path rejects once identifier-sale facts exist for that day
- admin code dashboard still renders manual leads safely when `importBatch` is null

- [ ] **Step 2: Run test to verify it fails**

Run:
- `npm test -- tests/unit/member-identifier-sale-service.test.ts tests/unit/admin-code-service.test.ts tests/unit/sales-service.test.ts`
Expected: FAIL because the new service does not exist and legacy code does not know about identifier sales.

- [ ] **Step 3: Implement the minimal service + bridge**

Implement focused functions such as:
- `getMemberIdentifierWorkspace`
- `saveIdentifierSaleForUser`
- `syncLegacySalesRecordFromIdentifierSales`
- `getIdentifierSalesForUser`
- `hasIdentifierSalesForUserOnDate`

Also update:
- `admin-code-service` to display manual leads with a fallback source label
- `sales-service.saveSalesRecordForUser` to reject legacy writes after identifier sales exist

- [ ] **Step 4: Re-run service tests**

Run:
- `npm test -- tests/unit/member-identifier-sale-service.test.ts tests/unit/admin-code-service.test.ts tests/unit/sales-service.test.ts`
Expected: PASS

### Task 4: Add member entry action contracts

**Files:**
- Modify: `src/app/(member)/entry/actions.ts`
- Modify: `src/app/(member)/entry/form-state.ts`
- Create: `tests/unit/member-identifier-entry-action.test.ts`
- Modify: `tests/unit/sales-entry-action.test.ts`

- [ ] **Step 1: Write failing action tests**

Cover:
- new identifier-sale action returns refreshed workspace state
- manual lead success includes source metadata
- assigned-lead success marks the lead as converted
- legacy daily save returns a friendly error when identifier-sale facts already exist

- [ ] **Step 2: Run test to verify it fails**

Run:
- `npm test -- tests/unit/member-identifier-entry-action.test.ts tests/unit/sales-entry-action.test.ts`
Expected: FAIL because the new action/state contracts are missing.

- [ ] **Step 3: Implement action/state glue**

Keep existing `saveSalesEntryAction` behavior for the fallback form, but add the new member identifier-sale action and response state.

- [ ] **Step 4: Re-run action tests**

Run:
- `npm test -- tests/unit/member-identifier-entry-action.test.ts tests/unit/sales-entry-action.test.ts`
Expected: PASS

### Task 5: Build `/entry` dual-track workspace UI

**Files:**
- Modify: `src/app/(member)/entry/page.tsx`
- Modify: `src/components/sales-entry-page-client.tsx`
- Create: `src/components/member-identifier-sale-form.tsx`
- Create: `src/components/member-identifier-sale-history.tsx`
- Modify: `tests/unit/entry-page.test.tsx`

- [ ] **Step 1: Write failing page tests**

Cover:
- `/entry` fetches member identifier workspace payload
- page shows the identifier-sale primary block and the legacy fallback block
- workspace exposes counts for assigned codes/leads and today identifier-sales total

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/entry-page.test.tsx`
Expected: FAIL because the page/client do not request or render the new workspace data.

- [ ] **Step 3: Implement the new member workspace UI**

Requirements:
- identifier sale is the primary call-to-action
- legacy daily summary form stays visible but visually marked as fallback/transition
- no deeply nested mega-component; keep the new form/history in separate files

- [ ] **Step 4: Re-run entry page tests**

Run: `npm test -- tests/unit/entry-page.test.tsx`
Expected: PASS

### Task 6: Expand `/records` to show identifier-level details

**Files:**
- Modify: `src/app/(member)/records/page.tsx`
- Modify: `src/components/my-records-table.tsx`
- Modify: `tests/unit/records-page.test.tsx`

- [ ] **Step 1: Write failing records tests**

Cover:
- records page includes identifier-sale detail source
- table renders identifier code, plan type, and lead source label

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/records-page.test.tsx`
Expected: FAIL because records still only know about daily summary rows.

- [ ] **Step 3: Implement minimal records-page enhancement**

Keep the page understandable:
- preserve high-level daily counts
- add a second section or richer row metadata for identifier sales

- [ ] **Step 4: Re-run records tests**

Run: `npm test -- tests/unit/records-page.test.tsx`
Expected: PASS

### Task 7: Run focused regression verification

**Files:**
- Modify only if verification reveals regressions

- [ ] **Step 1: Run focused tests**

Run:
- `npm test -- tests/unit/prisma-schema-contract.test.ts tests/unit/identifier-sale-validation.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/records-page.test.tsx tests/unit/admin-code-service.test.ts tests/unit/admin-codes-actions.test.ts tests/unit/admin-codes-page.test.tsx`

Expected: PASS

- [ ] **Step 2: Run typecheck and targeted lint**

Run:
- `npx tsc --noEmit`
- `npx eslint prisma/schema.prisma src/lib/validators/identifier-sale.ts src/server/services/member-identifier-sale-service.ts src/server/services/sales-service.ts src/server/services/admin-code-service.ts src/app/'(member)'/entry/actions.ts src/app/'(member)'/entry/form-state.ts src/app/'(member)'/entry/page.tsx src/components/sales-entry-page-client.tsx src/components/member-identifier-sale-form.tsx src/components/member-identifier-sale-history.tsx src/app/'(member)'/records/page.tsx src/components/my-records-table.tsx tests/unit/identifier-sale-validation.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/records-page.test.tsx`

Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS
