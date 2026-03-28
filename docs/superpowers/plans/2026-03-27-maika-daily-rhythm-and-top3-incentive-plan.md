# Maika Daily Rhythm And Top3 Incentive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有销售记录流程上增加秒级最后提交时间、审核状态、临时/正式前三规则，并把成员端 `/entry` 与管理员端 `/admin` 升级成真正的每日节奏入口。

**Architecture:** 继续复用当前 `Next.js App Router + Prisma + server actions` 结构，不创建独立“收单”模块，也不引入截图上传。数据层只在现有 `SalesRecord` 上扩展审核与时序字段；业务逻辑通过新的服务层统一计算“今日状态摘要”“临时前三”“正式前三”；成员端、管理员端和榜单页都只消费这些派生结果。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, Auth.js, Zod, Vitest, Playwright

---

## 0. Preconditions

- 本计划建立在 `feat/entry-feedback-cumulative-stats` 当前代码状态之上。
- 若执行环境仍停留在未合入该分支的 `main`，先合入或 cherry-pick 这批基础能力后再执行：
  - `/entry` 结构化成功卡
  - `/leaderboard/range` 累计统计模块
  - `/admin` 累计趋势面板
- 本轮不实现：
  - 截图上传
  - 文件存储
  - 独立收单模块
  - 激励金额结算
- 所有“今日 / 当天”逻辑统一按 `Asia/Shanghai` 业务日处理。
- 继续保持现有业务规则：
  - 每成员每天唯一一条 `SalesRecord`
  - 再次保存 = 更新同一条记录
  - 角色仅 `MEMBER / ADMIN`
  - 套餐仅 `40 / 60`

## 1. File Map

### Database / Validation

- Modify: `prisma/schema.prisma` — 为 `SalesRecord` 增加审核与时序字段，并新增审核状态枚举
- Create: `scripts/backfill-last-submitted-at.ts` — 一次性把历史记录的 `lastSubmittedAt` 近似回填为 `updatedAt`
- Modify: `src/lib/validators/sales.ts` — 增加管理员审核动作校验和排序/筛选输入校验
- Modify: `tests/unit/prisma-schema-contract.test.ts` — 锁定 schema 变化

### Service Layer

- Modify: `src/server/services/sales-service.ts` — 成员保存时写入 `lastSubmittedAt`，重置审核状态；管理员列表读取时提供新字段和排序
- Create: `src/server/services/daily-rhythm-service.ts` — 统一计算：
  - 成员 `/entry` 状态摘要
  - 管理员 `/admin` 状态摘要
  - 当日临时前三 / 正式前三
  - `/admin/sales` 排序数据
- Modify: `src/server/services/leaderboard-cache.ts` — 为日榜 / 管理员摘要新增缓存读取与失效覆盖

### Member UX

- Create: `src/components/entry-daily-rhythm-summary.tsx` — 成员端状态摘要 + 主动作 + 次级入口
- Modify: `src/components/sales-entry-page-client.tsx` — 接入成员端状态摘要和审核/激励提示
- Modify: `src/app/(member)/entry/page.tsx` — 读取成员端状态摘要数据

### Admin UX

- Create: `src/components/admin/admin-daily-review-summary.tsx` — 管理员首页“今日管理摘要”
- Modify: `src/components/admin/admin-cumulative-stats-panel.tsx` — 与新摘要区协调布局，不承担审核逻辑
- Modify: `src/app/(admin)/admin/page.tsx` — 同时读取累计趋势与审核摘要
- Modify: `src/components/admin/sales-table.tsx` — 展示秒级提交时间、审核状态、临时/正式前三标识、审核操作
- Modify: `src/app/(admin)/admin/sales/actions.ts` — 新增通过 / 驳回 action
- Modify: `src/app/(admin)/admin/sales/page.tsx` — 默认“仅看今日”、按状态分组 + 时间排序，接入摘要提示

### Leaderboard / Result Display

- Create: `src/components/daily-top3-strip.tsx` — 结果展示条，支持“临时前三 / 正式前三”
- Modify: `src/app/(shared)/leaderboard/daily/page.tsx` — 挂接今日前三展示

### Tests / Docs

- Create: `tests/unit/daily-rhythm-service.test.ts`
- Create: `tests/unit/entry-daily-rhythm-summary.test.tsx`
- Create: `tests/unit/admin-daily-review-summary.test.tsx`
- Create: `tests/unit/admin-sales-review-actions.test.ts`
- Modify: `tests/unit/leaderboard-actions-revalidation.test.ts`
- Modify: `tests/unit/admin-sales-management.test.ts`
- Create: `tests/e2e/daily-rhythm-and-review.spec.ts`
- Modify: `docs/ai/handoff.md`

## 2. Decomposition Notes

- 不要把“审核 + 前三计算 + 摘要判定”散落在 `/entry`、`/admin`、`/admin/sales` 各自页面里。必须抽成统一服务层，否则临时前三和正式前三很容易在不同页面算出不同结果。
- 不要单独存 `temporaryRank` / `finalRank`。它们都是派生结果，应该由“业务日 + 状态 + lastSubmittedAt + tie-break”实时计算。
- 不要把管理员摘要直接塞进 `AdminCumulativeStatsPanel`。累计趋势和今日审核节奏是两个不同问题，应该拆成两个组件，由 `/admin/page.tsx` 组合。
- `sales-table.tsx` 现在只负责数量和备注编辑；如果审核操作直接塞进去，组件会继续膨胀。计划允许把表格行卡拆出一个更小的 `admin-sales-review-card.tsx`，但只在这轮确实能提高可读性时进行。

## 3. Task Breakdown

### Task 1: Add audit fields and lock the data contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `scripts/backfill-last-submitted-at.ts`
- Modify: `src/lib/validators/sales.ts`
- Modify: `tests/unit/prisma-schema-contract.test.ts`

- [ ] **Step 1: Write the failing schema/validator tests**

Add assertions to `tests/unit/prisma-schema-contract.test.ts`:

```ts
expect(schema).toContain("enum SalesReviewStatus");
expect(schema).toContain("lastSubmittedAt DateTime");
expect(schema).toContain("reviewStatus SalesReviewStatus");
expect(schema).toContain("reviewedAt DateTime?");
expect(schema).toContain("reviewNote String?");
```

Add validator coverage for new review actions:

```ts
expect(() =>
  salesReviewActionSchema.parse({
    id: "record-1",
    decision: "APPROVED",
    returnTo: "/admin/sales",
  }),
).not.toThrow();
```

- [ ] **Step 2: Run the narrow tests and verify failure**

Run:

```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts
```

Expected: FAIL because the enum/fields/schemas do not exist yet.

- [ ] **Step 3: Extend the Prisma schema**

Add to `prisma/schema.prisma`:

```prisma
enum SalesReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model SalesRecord {
  ...
  lastSubmittedAt DateTime?
  reviewStatus    SalesReviewStatus @default(PENDING)
  reviewedAt      DateTime?
  reviewNote      String?

  @@index([saleDate, reviewStatus, lastSubmittedAt])
  @@index([saleDate, lastSubmittedAt])
}
```

Do **not** make `lastSubmittedAt` required in the first schema change. Historical rows already exist.

- [ ] **Step 4: Create the named backfill script with safety checks**

Create `scripts/backfill-last-submitted-at.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pendingBefore = await prisma.salesRecord.count({
    where: { lastSubmittedAt: null },
  });

  console.info(`[backfill-last-submitted-at] pending before=${pendingBefore}`);

  if (pendingBefore === 0) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "sales_records"
    SET "lastSubmittedAt" = "updatedAt"
    WHERE "lastSubmittedAt" IS NULL
  `;

  const pendingAfter = await prisma.salesRecord.count({
    where: { lastSubmittedAt: null },
  });

  console.info(`[backfill-last-submitted-at] pending after=${pendingAfter}`);

  if (pendingAfter > 0) {
    throw new Error("lastSubmittedAt backfill incomplete");
  }
}

main()
  .catch((error) => {
    console.error("[backfill-last-submitted-at] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 5: Run the DB change procedure in a fixed order**

Execute the database change in this exact order:

```bash
npm run prisma:validate
npx prisma migrate dev --name add-sales-review-fields
npx prisma generate
npx tsx scripts/backfill-last-submitted-at.ts
```

Expected:

- `prisma validate` passes
- Prisma creates a new migration for `add-sales-review-fields`
- Prisma Client regenerates successfully
- backfill script logs either `pending before=0` or finishes with `pending after=0`

Safety checks:

- stop immediately if `prisma validate` fails
- do not make `lastSubmittedAt` required until the backfill script succeeds
- if the script exits non-zero or `pending after` is not `0`, do not continue to application work

The intent is fixed:

- historical data uses `updatedAt` as approximate `lastSubmittedAt`
- new saves write a real `lastSubmittedAt`

- [ ] **Step 6: Add review validators**

In `src/lib/validators/sales.ts`, add:

```ts
export const salesReviewActionSchema = z.object({
  id: z.string().min(1, "销售记录 ID 缺失"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(200, "审核备注不能超过 200 个字符").optional(),
  returnTo: z.string().default("/admin/sales"),
});
```

- [ ] **Step 7: Re-run the schema/validator tests**

Run:

```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review the schema names carefully. Do not commit unless the user explicitly asks.

### Task 2: Make member saves update review state and last-submitted time

**Files:**
- Modify: `src/server/services/sales-service.ts`
- Modify: `src/app/(member)/entry/actions.ts`
- Modify: `src/app/(member)/entry/form-state.ts`
- Modify: `src/app/(admin)/admin/sales/actions.ts`
- Create: `tests/unit/admin-sales-review-actions.test.ts`
- Modify: `tests/unit/sales-entry-action.test.ts`
- Modify: `tests/unit/leaderboard-actions-revalidation.test.ts`

- [ ] **Step 1: Extend the failing action tests**

Update `tests/unit/sales-entry-action.test.ts` so success assertions include:

```ts
await expect(saveSalesEntryAction(undefined, formData)).resolves.toMatchObject({
  summary: {
    reviewStatus: "PENDING",
    lastSubmittedAtIso: expect.any(String),
  },
});
```

Create `tests/unit/admin-sales-review-actions.test.ts` to fail on missing admin review actions:

```ts
await expect(reviewSalesRecordAction(formData)).rejects.toThrow(
  "redirect:/admin/sales?notice=",
);
```

- [ ] **Step 2: Run the focused test set and verify failure**

Run:

```bash
npm run test -- tests/unit/sales-entry-action.test.ts tests/unit/admin-sales-review-actions.test.ts tests/unit/leaderboard-actions-revalidation.test.ts
```

Expected: FAIL because the new fields and review actions are not implemented.

- [ ] **Step 3: Update member-save behavior in `sales-service.ts`**

Change `saveSalesRecordForUser()` so member saves always:

```ts
const submittedAt = new Date();

update: {
  count40: payload.count40,
  count60: payload.count60,
  remark: payload.remark,
  lastSubmittedAt: submittedAt,
  reviewStatus: "PENDING",
  reviewedAt: null,
  reviewNote: null,
}
```

For create:

```ts
create: {
  userId,
  saleDate,
  count40: payload.count40,
  count60: payload.count60,
  remark: payload.remark,
  lastSubmittedAt: submittedAt,
  reviewStatus: "PENDING",
}
```

- [ ] **Step 4: Extend the entry action summary payload**

Add to `SalesEntrySummary` in `src/app/(member)/entry/form-state.ts`:

```ts
reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
lastSubmittedAtIso: string;
```

Map those fields in `src/app/(member)/entry/actions.ts`.

- [ ] **Step 5: Add admin review actions**

In `src/app/(admin)/admin/sales/actions.ts`, add:

```ts
export async function reviewSalesRecordAction(formData: FormData) {
  await requireAdminSession();
  const parsed = salesReviewActionSchema.parse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote"),
    returnTo: formData.get("returnTo"),
  });

  await db.salesRecord.update({
    where: { id: parsed.id },
    data: {
      reviewStatus: parsed.decision,
      reviewedAt: new Date(),
      reviewNote: parsed.decision === "REJECTED" ? parsed.reviewNote || null : null,
    },
  });

  revalidatePath("/admin/sales");
  refreshLeaderboardCaches();
  redirect(appendNotice(parsed.returnTo, parsed.decision === "APPROVED" ? "审核已通过" : "审核已驳回"));
}
```

- [ ] **Step 6: Re-run the action tests**

Run:

```bash
npm run test -- tests/unit/sales-entry-action.test.ts tests/unit/admin-sales-review-actions.test.ts tests/unit/leaderboard-actions-revalidation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review that member saves reset review state every time. Do not commit unless the user explicitly asks.

### Task 3: Build the unified daily-rhythm service

**Files:**
- Create: `src/server/services/daily-rhythm-service.ts`
- Modify: `src/server/services/leaderboard-cache.ts`
- Create: `tests/unit/daily-rhythm-service.test.ts`
- Modify: `tests/unit/leaderboard-cache.test.ts`

- [ ] **Step 1: Write the failing daily-rhythm service tests**

Create `tests/unit/daily-rhythm-service.test.ts` with pure logic coverage:

```ts
expect(buildTemporaryTop3(rows).map((row) => row.userName)).toEqual(["A", "B", "C"]);
expect(buildFormalTop3(rows).map((row) => row.userName)).toEqual(["A", "D"]);
expect(buildMemberDailyRhythmSummary(...)).toMatchObject({
  state: "PENDING_REVIEW",
  primaryAction: { href: "/leaderboard/daily" },
});
expect(buildAdminDailyRhythmSummary(...)).toMatchObject({
  pendingCount: 2,
  top3Status: "NOT_CONFIRMED",
});
```

Also cover:

- `Asia/Shanghai` business day filtering
- `REJECTED` records excluded from temporary top 3
- tie-break rule: `lastSubmittedAt ASC, id ASC`
- summary edge cases:
  - no submissions
  - `APPROVED < 3`
  - `APPROVED >= 3` with remaining `PENDING`
  - all rejected

- [ ] **Step 2: Extend the cache tests to cover new readers**

Update `tests/unit/leaderboard-cache.test.ts` to expect cached readers such as:

```ts
getCachedMemberDailyRhythmSummary(...)
getCachedAdminDailyRhythmSummary(...)
getCachedDailyTop3Status(...)
```

Keep them on the shared `LEADERBOARD_CACHE_TAG`.

- [ ] **Step 3: Run the new service/cache tests and verify failure**

Run:

```bash
npm run test -- tests/unit/daily-rhythm-service.test.ts tests/unit/leaderboard-cache.test.ts
```

Expected: FAIL because the service and cache readers do not exist.

- [ ] **Step 4: Implement pure helpers first**

In `src/server/services/daily-rhythm-service.ts`, add pure helpers:

```ts
export function buildTemporaryTop3(...)
export function buildFormalTop3(...)
export function buildMemberDailyRhythmSummary(...)
export function buildAdminDailyRhythmSummary(...)
export function buildAdminTodaySalesRows(...)
```

Use exact rules from the spec:

- temporary top 3: `PENDING | APPROVED`
- formal top 3: `APPROVED` only
- all filtered to current business day, visible members only
- sorted by `lastSubmittedAt ASC, id ASC`
- member “刚完成 / 刚更新” feedback continues to come from the existing `/entry` success card; the stable daily-rhythm summary should not invent an extra time-window state, and all submitted-but-unapproved rows collapse into the same `PENDING_REVIEW` branch

- [ ] **Step 5: Add database-backed readers**

Then add DB readers:

```ts
export async function getMemberDailyRhythmSummary(...)
export async function getAdminDailyRhythmSummary(...)
export async function getDailyTop3Status(...)
export async function getAdminTodaySalesRows(...)
```

These should:

- query today’s records only
- join `user.role` and `user.status`
- derive summaries from the pure helpers
- produce a single row DTO for `/admin/sales` that already contains:
  - `reviewStatus`
  - `lastSubmittedAt`
  - `reviewedAt`
  - `reviewNote`
  - `isTemporaryTop3`
  - `isFormalTop3`

Business-day source of truth is explicit:

- resolve `const todaySaleDate = getTodaySaleDateValue(now)` once per request
- filter Prisma by `saleDate: saleDateValueToDate(todaySaleDate)`
- pass `todaySaleDate` into the pure helpers as the membership key
- use `lastSubmittedAt` only to order rows that are already inside that `saleDate`
- never infer “today” from `lastSubmittedAt` or `reviewedAt`
- define “visible members only” concretely as `user.role === "MEMBER"` and `user.status === "ACTIVE"`

`/admin/sales/page.tsx` and `SalesTable` must consume this service DTO directly rather than recomputing top3 flags locally.

- [ ] **Step 6: Extend shared cache readers**

In `src/server/services/leaderboard-cache.ts`, wrap the new readers with `unstable_cache` and keep using `refreshLeaderboardCaches()` to invalidate:

```ts
revalidatePath("/entry");
revalidatePath("/admin");
revalidatePath("/leaderboard/daily");
```

- [ ] **Step 7: Re-run the service/cache tests**

Run:

```bash
npm run test -- tests/unit/daily-rhythm-service.test.ts tests/unit/leaderboard-cache.test.ts
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review the temporary/formal top 3 rules carefully. Do not commit unless the user explicitly asks.

### Task 4: Add member-side daily rhythm summary to `/entry`

**Files:**
- Create: `src/components/entry-daily-rhythm-summary.tsx`
- Modify: `src/components/sales-entry-page-client.tsx`
- Modify: `src/app/(member)/entry/page.tsx`
- Create: `tests/unit/entry-daily-rhythm-summary.test.tsx`
- Modify: `tests/e2e/member-entry.spec.ts`

- [ ] **Step 1: Write the failing member-summary component test**

Create `tests/unit/entry-daily-rhythm-summary.test.tsx`:

```tsx
render(
  <EntryDailyRhythmSummary
    summary={{
      state: "PENDING_REVIEW",
      message: "你今天已提交记录，当前正在等待管理员审核。",
      primaryAction: { href: "/leaderboard/daily", label: "查看当前状态" },
      secondaryActions: [
        { href: "/records", label: "查看我的记录" },
        { href: "/leaderboard/range", label: "查看总榜" },
      ],
      lastSubmittedAtLabel: "09:41:12",
      tempTop3Label: "当前处于临时前三",
    }}
  />,
);

expect(screen.getByText("你今天已提交记录，当前正在等待管理员审核。")).toBeInTheDocument();
expect(screen.getByText("当前处于临时前三")).toBeInTheDocument();
```

- [ ] **Step 2: Extend the member E2E**

Update `tests/e2e/member-entry.spec.ts` to assert after save:

- the page shows last submitted time copy
- the page shows review status `待审核`
- if returned summary says top3, the top3 badge is visible

- [ ] **Step 3: Run the focused tests and verify failure**

Run:

```bash
npm run test -- tests/unit/entry-daily-rhythm-summary.test.tsx && npm run test:e2e -- tests/e2e/member-entry.spec.ts
```

Expected: FAIL because the summary component and page integration do not exist.

- [ ] **Step 4: Implement the member summary component**

`src/components/entry-daily-rhythm-summary.tsx` should render:

- one status conclusion line
- one primary action
- two secondary actions
- optional lines for:
  - `最后提交时间`
  - `当前审核状态`
  - `临时前三 / 正式前三`

- [ ] **Step 5: Wire `/entry` to the new summary**

In `src/app/(member)/entry/page.tsx`, fetch today’s rhythm summary and pass it into `SalesEntryPageClient`.

Then update `src/components/sales-entry-page-client.tsx` to render the new summary block above the current success card / form area.

- [ ] **Step 6: Re-run the member summary tests**

Run:

```bash
npm run test -- tests/unit/entry-daily-rhythm-summary.test.tsx tests/unit/sales-entry-action.test.ts && npm run test:e2e -- tests/e2e/member-entry.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review mobile layout on `/entry`. Do not commit unless the user explicitly asks.

### Task 5: Add admin-side daily review summary and sales-review flow

**Files:**
- Create: `src/components/admin/admin-daily-review-summary.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/sales/page.tsx`
- Modify: `src/components/admin/sales-table.tsx`
- Create: `tests/unit/admin-daily-review-summary.test.tsx`
- Modify: `tests/unit/admin-sales-management.test.ts`
- Create: `tests/e2e/daily-rhythm-and-review.spec.ts`

- [ ] **Step 1: Write the failing admin-summary test**

Create `tests/unit/admin-daily-review-summary.test.tsx`:

```tsx
render(
  <AdminDailyReviewSummary
    summary={{
      message: "今天已有成员提交，当前还有记录待审核，建议优先确认今日前三。",
      pendingCount: 2,
      top3Status: "NOT_CONFIRMED",
      primaryAction: { href: "/admin/sales?scope=today", label: "去审核今日收单" },
      secondaryActions: [
        { href: "/leaderboard/range", label: "查看总榜" },
        { href: "/admin/announcements", label: "管理公告" },
      ],
    }}
  />,
);

expect(screen.getByText("去审核今日收单")).toBeInTheDocument();
expect(screen.getByText("2")).toBeInTheDocument();
expect(screen.getByText("查看总榜")).toBeInTheDocument();
expect(screen.getByText("管理公告")).toBeInTheDocument();
```

- [ ] **Step 2: Extend the admin-sales unit test**

Add sorting / status expectations to `tests/unit/admin-sales-management.test.ts`:

```ts
expect(sortAdminSalesRows(rows)[0].reviewStatus).toBe("PENDING");
expect(sortAdminSalesRows(rows)[0].lastSubmittedAt).toBe("2026-03-27T09:00:00.000Z");
```

- [ ] **Step 3: Write the failing review E2E**

Create `tests/e2e/daily-rhythm-and-review.spec.ts`:

```ts
test("admin can approve a pending record and formal top3 updates", async ({ page }) => {
  await page.goto("/admin/sales?scope=today");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForURL(/\/admin\/sales\?scope=today/, { timeout: 10000 });
  await page.getByRole("button", { name: "通过" }).first().click();
  await expect(page.getByText("审核已通过")).toBeVisible();
  await page.goto("/leaderboard/daily");
  await expect(page.getByText("正式前三")).toBeVisible();
});
```

- [ ] **Step 4: Run the focused tests and verify failure**

Run:

```bash
npm run test -- tests/unit/admin-daily-review-summary.test.tsx tests/unit/admin-sales-management.test.ts && npm run test:e2e -- tests/e2e/daily-rhythm-and-review.spec.ts
```

Expected: FAIL because the admin summary, sorting, and review UI do not exist.

- [ ] **Step 5: Implement the admin summary and sales page rules**

In `/admin/page.tsx`, fetch and render `AdminDailyReviewSummary` above the current cumulative trend panel.

In `/admin/sales/page.tsx`, add:

- default `scope=today`
- summary copy for today’s pending items
- default sort: `PENDING`, then `APPROVED`, then `REJECTED`
- within each group: `lastSubmittedAt ASC`, then `id ASC`

`AdminDailyReviewSummary` must always expose:

- one primary action
- two secondary actions

Use a fixed secondary pair to keep the contract stable:

- `/leaderboard/range` → `查看总榜`
- `/admin/announcements` → `管理公告`

- [ ] **Step 6: Extend `SalesTable` with review affordances**

Update `src/components/admin/sales-table.tsx` so each row shows:

- `最后提交时间`
- 审核状态标签
- 临时前三 / 正式前三标识
- one inline optional `textarea name="reviewNote"` dedicated to rejection notes
- buttons:
  - `通过` with `name="decision"` and `value="APPROVED"`
  - `驳回` with `name="decision"` and `value="REJECTED"`

Submission contract:

- both review buttons post to the same `reviewSalesRecordAction`
- `reviewNote` is optional and only persisted when `decision === "REJECTED"`
- approving a row clears any previous `reviewNote` back to `null`

Keep the existing count/remark editing flow intact unless a clearer split is needed.

- [ ] **Step 7: Re-run the admin review tests**

Run:

```bash
npm run test -- tests/unit/admin-daily-review-summary.test.tsx tests/unit/admin-sales-management.test.ts tests/unit/admin-sales-review-actions.test.ts && npm run test:e2e -- tests/e2e/daily-rhythm-and-review.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review whether `/admin/sales` still feels scannable when many rows are pending. Do not commit unless the user explicitly asks.

### Task 6: Show temporary/formal top3 results on the daily leaderboard

**Files:**
- Create: `src/components/daily-top3-strip.tsx`
- Modify: `src/app/(shared)/leaderboard/daily/page.tsx`
- Create: `tests/unit/daily-top3-strip.test.tsx`
- Modify: `tests/e2e/daily-rhythm-and-review.spec.ts`

- [ ] **Step 1: Write the failing top3-strip test**

Create `tests/unit/daily-top3-strip.test.tsx`:

```tsx
render(
  <DailyTop3Strip
    temporaryTop3={[{ userName: "A" }, { userName: "B" }]}
    formalTop3={[{ userName: "A" }]}
  />,
);

expect(screen.getByText("临时前三")).toBeInTheDocument();
expect(screen.getByText("正式前三")).toBeInTheDocument();
```

Also add an explicit empty-state assertion for:

- `temporaryTop3 = []`
- `formalTop3 = []`

- [ ] **Step 2: Extend the review E2E**

After an approval action in `tests/e2e/daily-rhythm-and-review.spec.ts`, assert:

- daily leaderboard shows `正式前三`
- rejected rows no longer occupy the temporary top3 set

- [ ] **Step 3: Run the focused tests and verify failure**

Run:

```bash
npm run test -- tests/unit/daily-top3-strip.test.tsx && npm run test:e2e -- tests/e2e/daily-rhythm-and-review.spec.ts
```

Expected: FAIL because the strip and leaderboard integration do not exist.

- [ ] **Step 4: Implement the strip and wire the page**

`src/components/daily-top3-strip.tsx` should display:

- temporary top3 list with “待审核” context
- formal top3 list from approved rows
- clear empty states when either list is empty

Then `src/app/(shared)/leaderboard/daily/page.tsx` should fetch today’s top3 status via the new service and render the strip above `LeaderboardTable`.

- [ ] **Step 5: Re-run the top3 display tests**

Run:

```bash
npm run test -- tests/unit/daily-top3-strip.test.tsx tests/unit/daily-rhythm-service.test.ts && npm run test:e2e -- tests/e2e/daily-rhythm-and-review.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint the diff**

Review the daily page when there are zero approved rows and when formal top3 is full. Do not commit unless the user explicitly asks.

### Task 7: Verify, update docs, and prepare handoff

**Files:**
- Modify: `docs/ai/handoff.md`

- [ ] **Step 1: Update the handoff**

Document:

- review-status schema changes
- `/entry` summary block
- `/admin` review summary
- `/admin/sales` approval flow
- daily temporary/formal top3 display

- [ ] **Step 2: Run the targeted verification set**

Run:

```bash
npm run test -- \
  tests/unit/prisma-schema-contract.test.ts \
  tests/unit/sales-entry-action.test.ts \
  tests/unit/leaderboard-actions-revalidation.test.ts \
  tests/unit/admin-sales-review-actions.test.ts \
  tests/unit/daily-rhythm-service.test.ts \
  tests/unit/entry-daily-rhythm-summary.test.tsx \
  tests/unit/admin-daily-review-summary.test.tsx \
  tests/unit/admin-sales-management.test.ts \
  tests/unit/daily-top3-strip.test.tsx \
  tests/unit/leaderboard-cache.test.ts

npm run test:e2e -- tests/e2e/member-entry.spec.ts tests/e2e/daily-rhythm-and-review.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run the broad safety net**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run test:e2e
npm run build
```

Expected: PASS.

- [ ] **Step 4: Final checkpoint**

Summarize:

- files changed
- tests run
- remaining risks:
  - historical `lastSubmittedAt` backfill is approximate
  - admin sales page density may increase after review controls
  - daily top3 wording may need polish once users see temporary vs formal states

Do not commit unless the user explicitly asks.
