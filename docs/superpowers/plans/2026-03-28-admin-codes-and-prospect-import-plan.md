# Admin Codes And Prospect Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first admin-side identifier-code and freshman-QQ workflow: import, inventory/lead pool views, and batch assignment to members.

**Architecture:** Extend the existing admin App Router patterns rather than creating a parallel subsystem. Add new Prisma models for identifier stock and prospect leads, encapsulate parsing and assignment logic in focused server services, then expose them through a single `/admin/codes` page with server actions and narrow client forms. This phase only covers admin import/inventory/assignment; member-side pre-delivery and identifier-backed sales stay untouched.

**Tech Stack:** Next.js 16 App Router, Server Actions, Prisma, PostgreSQL, Zod, ExcelJS, Vitest

---

## 1. File Map

### Database / Contracts

- Modify: `prisma/schema.prisma` — add identifier/prospect enums and models
- Create: `prisma/migrations/<timestamp>_add_identifier_codes_and_prospect_leads/migration.sql`
- Modify: `tests/unit/prisma-schema-contract.test.ts` — lock new models and enums

### Validation / Parsing

- Create: `src/lib/validators/codes.ts` — upload and assignment payload validation
- Create: `tests/unit/codes-validation.test.ts` — contract tests for upload/assignment schemas

### Service Layer

- Create: `src/server/services/admin-code-service.ts` — identifier/prospect import, list, metrics, assignment logic
- Create: `tests/unit/admin-code-service.test.ts` — red/green service tests for import, dedupe, assignment

### Admin Route / Actions / UI

- Create: `src/app/(admin)/admin/codes/page.tsx` — admin page and metrics
- Create: `src/app/(admin)/admin/codes/actions.ts` — import and assignment server actions
- Create: `src/app/(admin)/admin/codes/form-state.ts` — action states for uploads
- Create: `src/components/admin/code-import-card.tsx` — identifier import card
- Create: `src/components/admin/prospect-import-card.tsx` — QQ import card
- Create: `src/components/admin/code-assignment-panel.tsx` — batch assignment panel
- Create: `src/components/admin/code-inventory-table.tsx` — identifier inventory table
- Create: `src/components/admin/prospect-lead-table.tsx` — lead pool table
- Modify: `src/app/(admin)/admin/page.tsx` — add quick entry card
- Create: `tests/unit/admin-codes-page.test.tsx` — page rendering and messaging
- Create: `tests/unit/admin-codes-actions.test.ts` — action-level tests

## 2. Execution Notes

- Keep imports narrowly scoped: this phase must not rewrite `/entry`, `/records`, or the existing sales-record model.
- Parse uploads server-side with `ExcelJS.Workbook.xlsx.load(...)`; accept `.xlsx`, `.xls`, and `.csv` filenames, but normalize to row arrays inside the service.
- QQ import minimum columns are `QQ号` and `专业`. Missing either column is a hard error.
- Identifier dedupe key: `code`
- Prospect dedupe key: `qqNumber`
- Assignment target eligibility: active non-admin users only
- Future-proofing: `ProspectLead` stores both `assignedToUserId` and `assignedGroupId`, but only `assignedToUserId` is populated in this phase.

## 3. Task Breakdown

### Task 1: Lock the new Prisma contract before implementation

**Files:**
- Modify: `tests/unit/prisma-schema-contract.test.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_identifier_codes_and_prospect_leads/migration.sql`

- [ ] **Step 1: Write the failing schema contract test**

Add assertions for:
- `enum IdentifierCodeStatus`
- `enum ProspectLeadStatus`
- `model IdentifierImportBatch`
- `model IdentifierCode`
- `model CodeAssignment`
- `model ProspectImportBatch`
- `model ProspectLead`
- `assignedGroupId String?`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/prisma-schema-contract.test.ts`
Expected: FAIL because the new enums/models do not exist yet.

- [ ] **Step 3: Add minimal Prisma schema and migration**

Define the new enums/models with:
- import batches storing filename, counts, and importer
- identifiers storing code, status, owner, timestamps
- code assignments storing historical handoff
- prospect batches storing filename, counts, and importer
- prospect leads storing `qqNumber`, `major`, status, assignment fields, timestamps

- [ ] **Step 4: Run contract test and Prisma validation**

Run:
- `npm test -- tests/unit/prisma-schema-contract.test.ts`
- `npm run prisma:validate`
Expected: PASS

### Task 2: Lock validation and parsing behavior with failing tests

**Files:**
- Create: `src/lib/validators/codes.ts`
- Create: `tests/unit/codes-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Cover:
- identifier assignment requires target user id and at least one code id
- prospect assignment requires target user id and at least one lead id
- upload form schemas reject empty filenames / missing files

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/codes-validation.test.ts`
Expected: FAIL because the validator file does not exist.

- [ ] **Step 3: Implement minimal validation schemas**

Add focused Zod schemas for:
- identifier upload action
- prospect upload action
- identifier assignment action
- prospect assignment action

- [ ] **Step 4: Re-run validation tests**

Run: `npm test -- tests/unit/codes-validation.test.ts`
Expected: PASS

### Task 3: Build service-layer import and assignment logic with TDD

**Files:**
- Create: `src/server/services/admin-code-service.ts`
- Create: `tests/unit/admin-code-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Cover:
- importing identifiers skips duplicates and returns counts
- importing prospects reads `QQ号` + `专业`, skips duplicate QQs, errors on missing columns
- listing admin code dashboard metrics aggregates identifier and prospect statuses
- assigning identifiers updates owner/status/timestamps and writes `CodeAssignment`
- assigning prospects updates lead status and assignee
- assignment rejects inactive/admin targets

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/admin-code-service.test.ts`
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement minimal service logic**

Implement focused functions such as:
- `parseIdentifierUpload`
- `parseProspectUpload`
- `importIdentifierCodes`
- `importProspectLeads`
- `assignIdentifierCodesToUser`
- `assignProspectLeadsToUser`
- `getAdminCodesDashboardData`

- [ ] **Step 4: Re-run service tests**

Run: `npm test -- tests/unit/admin-code-service.test.ts`
Expected: PASS

### Task 4: Add admin route actions and page contracts

**Files:**
- Create: `src/app/(admin)/admin/codes/actions.ts`
- Create: `src/app/(admin)/admin/codes/form-state.ts`
- Create: `tests/unit/admin-codes-actions.test.ts`

- [ ] **Step 1: Write failing action tests**

Cover:
- import actions enforce admin access
- import actions return friendly success/error summaries
- assignment actions redirect with success/error notices
- actions refresh `/admin/codes`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/admin-codes-actions.test.ts`
Expected: FAIL because the actions do not exist.

- [ ] **Step 3: Implement actions with minimal glue**

Use the service functions and existing admin-action patterns (`revalidatePath`, `redirect`, friendly notices).

- [ ] **Step 4: Re-run action tests**

Run: `npm test -- tests/unit/admin-codes-actions.test.ts`
Expected: PASS

### Task 5: Build the `/admin/codes` UI and admin entry point

**Files:**
- Create: `src/app/(admin)/admin/codes/page.tsx`
- Create: `src/components/admin/code-import-card.tsx`
- Create: `src/components/admin/prospect-import-card.tsx`
- Create: `src/components/admin/code-assignment-panel.tsx`
- Create: `src/components/admin/code-inventory-table.tsx`
- Create: `src/components/admin/prospect-lead-table.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Create: `tests/unit/admin-codes-page.test.tsx`

- [ ] **Step 1: Write failing page tests**

Cover:
- page requires admin auth
- page shows metrics, upload cards, assignment panel, inventory table, and lead table
- admin homepage includes the new quick entry

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/admin-codes-page.test.tsx tests/unit/leader-pages.test.tsx`
Expected: FAIL because the route/components do not exist and admin home lacks the quick entry.

- [ ] **Step 3: Implement the page and focused UI components**

Requirements:
- keep cards/forms visually consistent with existing admin pages
- clearly explain current phase boundaries
- show candidate assignees as active non-admin users
- separate identifier inventory from prospect leads to avoid mixed mental models

- [ ] **Step 4: Re-run page tests**

Run: `npm test -- tests/unit/admin-codes-page.test.tsx tests/unit/leader-pages.test.tsx`
Expected: PASS

### Task 6: Run focused regression verification

**Files:**
- Modify only if required by failures discovered during verification

- [ ] **Step 1: Run focused test suite**

Run:
- `npm test -- tests/unit/prisma-schema-contract.test.ts tests/unit/codes-validation.test.ts tests/unit/admin-code-service.test.ts tests/unit/admin-codes-actions.test.ts tests/unit/admin-codes-page.test.tsx tests/unit/group-management.test.ts tests/unit/member-actions.test.ts tests/unit/leader-pages.test.tsx`

Expected: PASS

- [ ] **Step 2: Run typecheck and targeted lint**

Run:
- `npx tsc --noEmit`
- `npx eslint prisma/schema.prisma src/app/'(admin)'/admin/codes/page.tsx src/app/'(admin)'/admin/codes/actions.ts src/components/admin/code-import-card.tsx src/components/admin/prospect-import-card.tsx src/components/admin/code-assignment-panel.tsx src/components/admin/code-inventory-table.tsx src/components/admin/prospect-lead-table.tsx src/server/services/admin-code-service.ts src/lib/validators/codes.ts tests/unit/codes-validation.test.ts tests/unit/admin-code-service.test.ts tests/unit/admin-codes-actions.test.ts tests/unit/admin-codes-page.test.tsx src/app/'(admin)'/admin/page.tsx`

Expected: PASS

- [ ] **Step 3: Run production build if the above stays green**

Run: `npm run build`
Expected: PASS

