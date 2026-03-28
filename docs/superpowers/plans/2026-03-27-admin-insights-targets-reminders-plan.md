# Admin Insights, Daily Targets, and Member Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-first diagnostics module that generates per-member daily targets, scores mixed anomalies, lets admins adjust targets and send in-app reminders, and surfaces target/trend/reminder feedback on `/entry`.

**Architecture:** Add three new domain slices on top of the existing sales workflow: per-member daily targets, member reminders, and admin insights scoring. Keep `/admin/sales` focused on review operations, add a new `/admin/insights` page for diagnosis and actions, and extend `/entry` with read-only target/trend/reminder feedback using server-side services plus thin UI components.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma/PostgreSQL, Auth.js, Zod, Vitest, Playwright

---

## File Structure

### Data model and validation

- Modify: `prisma/schema.prisma`
  - Add `DailyTarget`, `MemberReminder`, and optional lightweight action-status fields needed by the diagnostics workflow.
- Create: `prisma/migrations/20260327190000_add_admin_insights_targets_and_reminders/migration.sql`
  - Persist the new schema in SQL form.
- Modify: `tests/unit/prisma-schema-contract.test.ts`
  - Lock the new Prisma contract fields and enums.
- Create: `src/lib/validators/target.ts`
  - Validate admin target adjustments.
- Create: `src/lib/validators/reminder.ts`
  - Validate reminder sending payloads and template/custom content.

### Service layer

- Create: `src/server/services/daily-target-service.ts`
  - Generate suggested targets, persist daily target records, and update final targets.
- Create: `src/server/services/member-reminder-service.ts`
  - Build reminder templates, persist reminders, and return member reminder lists.
- Create: `src/server/services/admin-insights-service.ts`
  - Compute diagnostics summaries, anomaly reasons, recommended actions, and prioritized member cards.
- Modify: `src/server/services/leaderboard-cache.ts`
  - Cache admin insights data and member target/reminder feedback if useful.
- Modify: `src/server/services/sales-service.ts`
  - Expose helper reads needed for target progress and member trend comparisons.

### Admin UI

- Create: `src/app/(admin)/admin/insights/page.tsx`
  - New admin diagnostics page entrypoint.
- Create: `src/app/(admin)/admin/insights/actions.ts`
  - Server actions for target adjustment and reminder sending.
- Create: `src/app/(admin)/admin/insights/form-state.ts`
  - Shared action state types for admin interactions.
- Create: `src/components/admin/admin-insights-overview.tsx`
  - Top-level metrics and anomaly distribution block.
- Create: `src/components/admin/admin-insight-member-card.tsx`
  - Member diagnosis card with risk, reasons, and actions.
- Create: `src/components/admin/admin-target-adjust-form.tsx`
  - Inline or drawer-friendly target adjustment form.
- Create: `src/components/admin/admin-reminder-form.tsx`
  - Template/custom reminder sending form.

### Member UI

- Modify: `src/app/(member)/entry/page.tsx`
  - Read the new member target/reminder feedback alongside existing daily rhythm data.
- Modify: `src/app/(member)/entry/actions.ts`
  - Refresh the new member feedback after save.
- Modify: `src/app/(member)/entry/form-state.ts`
  - Extend action summary types with target/reminder feedback.
- Modify: `src/components/sales-entry-page-client.tsx`
  - Render the new entry-side cards above the form.
- Create: `src/components/entry-daily-target-card.tsx`
  - Show target, current progress, and gap.
- Create: `src/components/entry-self-trend-summary.tsx`
  - Show the member’s up/flat/down comparison against recent self baseline.
- Create: `src/components/entry-reminder-list.tsx`
  - Show recent in-app reminders.

### Tests

- Create: `tests/unit/daily-target-service.test.ts`
- Create: `tests/unit/member-reminder-service.test.ts`
- Create: `tests/unit/admin-insights-service.test.ts`
- Create: `tests/unit/admin-insights-page.test.tsx`
- Create: `tests/unit/entry-daily-target-card.test.tsx`
- Create: `tests/unit/entry-reminder-list.test.tsx`
- Modify: `tests/unit/sales-entry-action.test.ts`
- Modify: `tests/unit/sales-entry-page-client.test.ts`
- Create: `tests/e2e/admin-insights.spec.ts`
- Modify: `tests/e2e/member-entry.spec.ts`

## Task 1: Add Prisma Models and Validators

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260327190000_add_admin_insights_targets_and_reminders/migration.sql`
- Modify: `tests/unit/prisma-schema-contract.test.ts`
- Create: `src/lib/validators/target.ts`
- Create: `src/lib/validators/reminder.ts`

- [ ] **Step 1: Write the failing schema contract test**

```ts
test("locks daily target and reminder models", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  expect(schema).toContain("model DailyTarget");
  expect(schema).toContain("model MemberReminder");
  expect(schema).toMatch(/finalTotal\s+Int/);
  expect(schema).toMatch(/status\s+ReminderStatus/);
});
```

- [ ] **Step 2: Run the schema contract test to verify it fails**

Run: `npm run test -- tests/unit/prisma-schema-contract.test.ts`
Expected: FAIL because the new models/enums are missing.

- [ ] **Step 3: Add the schema and migration**

```prisma
enum ReminderStatus {
  UNREAD
  READ
}

model DailyTarget {
  id               String   @id @default(cuid())
  userId           String
  targetDate       DateTime @db.Date
  suggestedTotal   Int
  finalTotal       Int
  suggestionReason String
  adjustedBy       String?
  adjustedAt       DateTime?
  user             User     @relation(...)
}
```

- [ ] **Step 4: Add target and reminder validators**

```ts
export const dailyTargetAdjustSchema = z.object({
  targetId: z.string().min(1),
  finalTotal: z.coerce.number().int().min(0),
});

export const memberReminderSchema = z.object({
  userId: z.string().min(1),
  template: z.enum(["TARGET_GAP", "MISSING_SUBMISSION", "FOLLOW_UP", "CUSTOM"]),
  title: z.string().trim().min(1).max(60),
  content: z.string().trim().min(1).max(300),
});
```

- [ ] **Step 5: Re-run the schema contract test**

Run: `npm run test -- tests/unit/prisma-schema-contract.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260327190000_add_admin_insights_targets_and_reminders/migration.sql tests/unit/prisma-schema-contract.test.ts src/lib/validators/target.ts src/lib/validators/reminder.ts
git commit -m "feat: add target and reminder data model"
```

## Task 2: Implement Target Suggestion and Reminder Services

**Files:**
- Create: `src/server/services/daily-target-service.ts`
- Create: `src/server/services/member-reminder-service.ts`
- Create: `tests/unit/daily-target-service.test.ts`
- Create: `tests/unit/member-reminder-service.test.ts`
- Modify: `src/server/services/sales-service.ts`

- [ ] **Step 1: Write the failing target service test**

```ts
test("buildSuggestedDailyTarget uses recent sales and recent status signals", () => {
  expect(buildSuggestedDailyTarget(input)).toMatchObject({
    suggestedTotal: 6,
    suggestionReason: expect.stringContaining("近 7 天"),
  });
});
```

- [ ] **Step 2: Run the target service test to verify it fails**

Run: `npm run test -- tests/unit/daily-target-service.test.ts`
Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Write the failing reminder service test**

```ts
test("buildReminderFromTemplate returns title and content for target gap reminders", () => {
  expect(buildReminderFromTemplate("TARGET_GAP", context)).toMatchObject({
    title: expect.stringContaining("目标"),
    content: expect.stringContaining("还差"),
  });
});
```

- [ ] **Step 4: Run the reminder service test to verify it fails**

Run: `npm run test -- tests/unit/member-reminder-service.test.ts`
Expected: FAIL because the service does not exist yet.

- [ ] **Step 5: Implement minimal target suggestion helpers**

```ts
export function buildSuggestedDailyTarget(input: TargetSuggestionInput) {
  const baseline = Math.round(input.recentAverage);
  const adjusted = applyStatusAdjustment(baseline, input);
  return {
    suggestedTotal: Math.max(0, adjusted),
    suggestionReason: buildSuggestionReason(input, adjusted),
  };
}
```

- [ ] **Step 6: Implement minimal reminder helpers**

```ts
export function buildReminderFromTemplate(
  template: ReminderTemplate,
  context: ReminderTemplateContext,
) {
  if (template === "TARGET_GAP") {
    return {
      title: "今日目标仍有差距",
      content: `你今天距离目标还差 ${context.gap} 单，请尽快跟进。`,
    };
  }
  return context.custom;
}
```

- [ ] **Step 7: Add persistence helpers**

Run implementation for:
- generating daily targets for all active members
- updating `finalTotal`
- listing recent reminders for a member
- creating reminder records from template/custom input

- [ ] **Step 8: Re-run both unit tests**

Run: `npm run test -- tests/unit/daily-target-service.test.ts tests/unit/member-reminder-service.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/server/services/daily-target-service.ts src/server/services/member-reminder-service.ts src/server/services/sales-service.ts tests/unit/daily-target-service.test.ts tests/unit/member-reminder-service.test.ts
git commit -m "feat: add target suggestion and reminder services"
```

## Task 3: Implement Admin Insights Scoring Service

**Files:**
- Create: `src/server/services/admin-insights-service.ts`
- Create: `tests/unit/admin-insights-service.test.ts`
- Modify: `src/server/services/leaderboard-cache.ts`

- [ ] **Step 1: Write the failing admin insights service test**

```ts
test("buildAdminInsightMemberCard returns risk level, reason tags, and recommended actions", () => {
  expect(buildAdminInsightMemberCard(input)).toMatchObject({
    riskLevel: "HIGH",
    reasonTags: expect.arrayContaining(["结果下滑", "目标偏差过大"]),
    recommendedActions: expect.arrayContaining(["ADJUST_TARGET", "SEND_REMINDER"]),
  });
});
```

- [ ] **Step 2: Run the admin insights service test to verify it fails**

Run: `npm run test -- tests/unit/admin-insights-service.test.ts`
Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Implement scoring helpers**

```ts
export function scoreMemberInsight(input: MemberInsightInput) {
  const resultSignals = scoreResultSignals(input);
  const behaviorSignals = scoreBehaviorSignals(input);
  const comparisonSignals = scoreComparisonSignals(input);
  const score = resultSignals + behaviorSignals + comparisonSignals;
  return toRiskSummary(score, input);
}
```

- [ ] **Step 4: Implement summary and card builders**

Add helpers for:
- top metrics
- anomaly distribution
- prioritized member cards
- processed/observed grouping

- [ ] **Step 5: Add cached readers**

```ts
export function getCachedAdminInsights(input: { date?: DateValue }) {
  return cachedAdminInsights(input);
}
```

- [ ] **Step 6: Re-run the admin insights unit test**

Run: `npm run test -- tests/unit/admin-insights-service.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/server/services/admin-insights-service.ts src/server/services/leaderboard-cache.ts tests/unit/admin-insights-service.test.ts
git commit -m "feat: add admin insights scoring service"
```

## Task 4: Build Read-Only Admin Insights Page

**Files:**
- Create: `src/app/(admin)/admin/insights/page.tsx`
- Create: `src/components/admin/admin-insights-overview.tsx`
- Create: `src/components/admin/admin-insight-member-card.tsx`
- Create: `tests/unit/admin-insights-page.test.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Write the failing admin insights page test**

```tsx
test("renders admin insights overview metrics and risk-ranked member cards", async () => {
  render(await AdminInsightsPage());
  expect(screen.getByText("经营诊断中心")).toBeInTheDocument();
  expect(screen.getByText("今日高风险成员")).toBeInTheDocument();
  expect(screen.getByText("调整今日目标")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the page test to verify it fails**

Run: `npm run test -- tests/unit/admin-insights-page.test.tsx`
Expected: FAIL because the page/components do not exist yet.

- [ ] **Step 3: Build the read-only page and components**

Implement:
- overview cards
- anomaly distribution block
- member card layout
- links from `/admin` to `/admin/insights`

- [ ] **Step 4: Re-run the page test**

Run: `npm run test -- tests/unit/admin-insights-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(admin)/admin/insights/page.tsx src/components/admin/admin-insights-overview.tsx src/components/admin/admin-insight-member-card.tsx src/app/(admin)/admin/page.tsx tests/unit/admin-insights-page.test.tsx
git commit -m "feat: add read-only admin insights page"
```

## Task 5: Add Admin Target Adjustment and Reminder Actions

**Files:**
- Create: `src/app/(admin)/admin/insights/actions.ts`
- Create: `src/app/(admin)/admin/insights/form-state.ts`
- Create: `src/components/admin/admin-target-adjust-form.tsx`
- Create: `src/components/admin/admin-reminder-form.tsx`
- Modify: `tests/unit/leaderboard-actions-revalidation.test.ts`

- [ ] **Step 1: Write the failing target adjust action test**

```ts
test("admin can update final target from the insights page", async () => {
  await expect(adjustDailyTargetAction(formData)).rejects.toThrow("redirect:");
  expect(dailyTargetUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
    data: { finalTotal: 8 },
  }));
});
```

- [ ] **Step 2: Write the failing reminder action test**

```ts
test("admin can create a reminder from template context", async () => {
  await expect(sendMemberReminderAction(formData)).rejects.toThrow("redirect:");
  expect(memberReminderCreateMock).toHaveBeenCalled();
});
```

- [ ] **Step 3: Run both action tests to verify they fail**

Run: `npm run test -- tests/unit/admin-sales-review-actions.test.ts tests/unit/leaderboard-actions-revalidation.test.ts`
Expected: FAIL after adding the new expectations or companion tests.

- [ ] **Step 4: Implement admin actions and form-state**

Add:
- target adjustment server action
- reminder send server action
- cache/path refresh wiring

- [ ] **Step 5: Implement the two admin forms**

Add UI for:
- adjusting `finalTotal`
- choosing a template or custom reminder content

- [ ] **Step 6: Re-run the action tests**

Run: `npm run test -- tests/unit/leaderboard-actions-revalidation.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/(admin)/admin/insights/actions.ts src/app/(admin)/admin/insights/form-state.ts src/components/admin/admin-target-adjust-form.tsx src/components/admin/admin-reminder-form.tsx tests/unit/leaderboard-actions-revalidation.test.ts
git commit -m "feat: add admin insights actions"
```

## Task 6: Extend `/entry` with Target, Trend, and Reminder Feedback

**Files:**
- Modify: `src/app/(member)/entry/page.tsx`
- Modify: `src/app/(member)/entry/actions.ts`
- Modify: `src/app/(member)/entry/form-state.ts`
- Modify: `src/components/sales-entry-page-client.tsx`
- Create: `src/components/entry-daily-target-card.tsx`
- Create: `src/components/entry-self-trend-summary.tsx`
- Create: `src/components/entry-reminder-list.tsx`
- Create: `tests/unit/entry-daily-target-card.test.tsx`
- Create: `tests/unit/entry-reminder-list.test.tsx`
- Modify: `tests/unit/sales-entry-action.test.ts`
- Modify: `tests/unit/sales-entry-page-client.test.ts`

- [ ] **Step 1: Write the failing member feedback component tests**

```tsx
test("renders today target, progress, and gap", () => {
  render(<EntryDailyTargetCard feedback={feedback} />);
  expect(screen.getByText("今日目标")).toBeInTheDocument();
  expect(screen.getByText("还差 3 单")).toBeInTheDocument();
});
```

```tsx
test("renders recent reminders in reverse chronological order", () => {
  render(<EntryReminderList reminders={reminders} />);
  expect(screen.getByText("今日目标仍有差距")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new component tests to verify they fail**

Run: `npm run test -- tests/unit/entry-daily-target-card.test.tsx tests/unit/entry-reminder-list.test.tsx`
Expected: FAIL because the components do not exist yet.

- [ ] **Step 3: Extend member action state tests**

Add expectations in:
- `tests/unit/sales-entry-action.test.ts`
- `tests/unit/sales-entry-page-client.test.ts`

for target feedback and reminder refresh behavior.

- [ ] **Step 4: Run those tests to verify they fail**

Run: `npm run test -- tests/unit/sales-entry-action.test.ts tests/unit/sales-entry-page-client.test.ts`
Expected: FAIL because the new summary fields are not wired yet.

- [ ] **Step 5: Implement member-side components and page wiring**

Render:
- target card
- self trend summary
- recent reminder list

- [ ] **Step 6: Update member action refresh behavior**

After save, return updated target/trend/reminder data in the action summary.

- [ ] **Step 7: Re-run the four member-side tests**

Run: `npm run test -- tests/unit/entry-daily-target-card.test.tsx tests/unit/entry-reminder-list.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/sales-entry-page-client.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/(member)/entry/page.tsx src/app/(member)/entry/actions.ts src/app/(member)/entry/form-state.ts src/components/sales-entry-page-client.tsx src/components/entry-daily-target-card.tsx src/components/entry-self-trend-summary.tsx src/components/entry-reminder-list.tsx tests/unit/entry-daily-target-card.test.tsx tests/unit/entry-reminder-list.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/sales-entry-page-client.test.ts
git commit -m "feat: add member target and reminder feedback"
```

## Task 7: Add End-to-End Coverage and Final Verification

**Files:**
- Create: `tests/e2e/admin-insights.spec.ts`
- Modify: `tests/e2e/member-entry.spec.ts`
- Modify: `docs/ai/handoff.md`
- Modify: `README.md`
- Modify: `docs/deployment/vercel.md`

- [ ] **Step 1: Write the failing admin insights E2E**

```ts
test("admin can review diagnostics, adjust target, and send a reminder", async ({ page }) => {
  await page.goto("/admin/insights");
  await expect(page.getByText("经营诊断中心")).toBeVisible();
  await page.getByRole("button", { name: "调整今日目标" }).click();
  await page.getByRole("button", { name: "发送提醒" }).click();
});
```

- [ ] **Step 2: Extend member entry E2E expectations**

Add assertions for:
- seeing today target
- seeing current gap
- seeing a recent reminder on `/entry`

- [ ] **Step 3: Run the two E2E specs to verify they fail**

Run: `npx playwright test tests/e2e/admin-insights.spec.ts tests/e2e/member-entry.spec.ts`
Expected: FAIL because the flow is not wired end-to-end yet.

- [ ] **Step 4: Finish any missing wiring and docs**

Update docs to describe:
- `/admin/insights`
- daily target generation
- reminder behavior
- deployment impact if new tables need migration

- [ ] **Step 5: Re-run targeted E2E**

Run: `npx playwright test tests/e2e/admin-insights.spec.ts tests/e2e/member-entry.spec.ts`
Expected: PASS

- [ ] **Step 6: Run full verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
npm run test:e2e
```

Expected:
- lint passes
- type check passes
- unit tests pass
- build passes
- all Playwright tests pass

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/admin-insights.spec.ts tests/e2e/member-entry.spec.ts docs/ai/handoff.md README.md docs/deployment/vercel.md
git commit -m "feat: ship admin insights and member target feedback"
```
