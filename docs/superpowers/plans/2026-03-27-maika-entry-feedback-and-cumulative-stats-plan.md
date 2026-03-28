# Maika Entry Feedback And Cumulative Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 `/entry` 保存确认体验，并在成员端 `/leaderboard/range` 与管理员首页加入累计买卡统计模块。

**Architecture:** 保持现有 `Next.js App Router + server actions + Prisma` 结构，不新增数据库字段，也不引入第三方图表库。录入确认通过 richer action state + client wrapper + 独立成功卡组件完成；累计统计通过新的服务层聚合函数产出成员条形排行和管理员趋势序列，并继续复用现有榜单缓存失效链路。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, Vitest, Playwright

---

## 0. Preconditions

- 不新增图表依赖。成员端条形图和管理员趋势图都使用项目内组件 + CSS / inline SVG 实现。
- 保持现有业务模型不变：
  - `SalesRecord` 仍只有 `count40` / `count60` / `remark`
  - 不引入“销售额”新字段
  - `saveSalesEntryAction` 仍走现有 server action 流程
- 图表统计对象固定为：
  - 仅 `role === MEMBER`
  - 若已有榜单可见性过滤，应复用同一口径
- 继续复用 `LEADERBOARD_CACHE_TAG` 的失效逻辑，新增统计读取后同步覆盖 `/admin` 的 revalidate。
- Playwright 依赖现有中文标签；不要改掉 `账号`、`密码`、`40 套餐`、`60 套餐`、`开始日期`、`结束日期`、`保存今日记录` 这些可见标签。
- 本仓库当前有未提交的 `docs/ai/handoff.md` 改动。执行过程中不要覆盖或回退它。

## 1. File Map

### Entry Feedback Flow

- Modify: `src/server/services/sales-service.ts` — 保存结果增加 `isUpdate` 元数据，并补充本轮要用到的日期辅助函数
- Modify: `src/app/(member)/entry/form-state.ts` — 扩展 `SalesEntryFormState`，支持结构化成功摘要
- Modify: `src/app/(member)/entry/actions.ts` — 把服务层结果映射成 UI 可直接消费的成功状态
- Create: `src/components/sales-entry-success-card.tsx` — 录入成功后的结构化确认卡
- Create: `src/components/sales-entry-page-client.tsx` — 客户端 wrapper，统一管理 `useActionState`、header 状态和成功卡
- Modify: `src/components/sales-entry-form.tsx` — 从“自带 action state”改为“纯表单展示 + 接收外部状态/动作”
- Modify: `src/app/(member)/entry/page.tsx` — 服务端负责鉴权和初始数据，渲染新的 client wrapper

### Cumulative Stats

- Create: `src/server/services/cumulative-sales-stats-service.ts` — 时间范围解析、成员过滤、累计排行、趋势序列、按月降采样
- Modify: `src/server/services/leaderboard-cache.ts` — 新增累计统计缓存读取，并把 `/admin` 纳入刷新路径
- Create: `src/components/cumulative-ranking-chart.tsx` — 成员端“前 10 + 我的位置”条形排行
- Create: `src/components/cumulative-trend-chart.tsx` — 管理员端趋势图 SVG 组件
- Create: `src/components/admin/admin-cumulative-stats-panel.tsx` — 管理员首页的筛选器、摘要和趋势图组合块
- Modify: `src/app/(shared)/leaderboard/range/page.tsx` — 默认区间改为“本月”，并接入累计排行模块
- Modify: `src/app/(admin)/admin/page.tsx` — 接入管理员累计趋势模块并读取 search params

### Tests / Docs

- Create: `tests/unit/sales-entry-action.test.ts`
- Create: `tests/unit/sales-entry-success-card.test.tsx`
- Modify: `tests/unit/leaderboard-actions-revalidation.test.ts`
- Create: `tests/unit/cumulative-sales-stats-service.test.ts`
- Create: `tests/unit/cumulative-ranking-chart.test.tsx`
- Create: `tests/unit/cumulative-trend-chart.test.tsx`
- Modify: `tests/unit/leaderboard-cache.test.ts`
- Modify: `tests/e2e/member-entry.spec.ts`
- Create: `tests/e2e/cumulative-stats.spec.ts`
- Modify: `docs/ai/handoff.md`

## 2. Decomposition Notes

- 不要把成功卡逻辑塞回 `SalesEntryForm`。`/entry` 现在已经有 header、指标卡、说明侧栏；成功卡要成为 header 下方的独立反馈层，最合适的边界是单独的 client wrapper。
- 不要把累计统计硬塞进 `leaderboard-service.ts`。现有服务只做“某个时间范围的总榜聚合”；本轮新需求还包含：
  - 默认本月 / 近 30 天 / 全历史
  - `Top 5` 趋势序列
  - `前 10 + 我的位置`
  - `全历史 > 180 天` 的按月降采样
  这些责任明显更适合独立服务文件。
- 由于没有图表库，图表组件必须是可测试的纯 props 组件，避免把查询、状态切换和 SVG 计算混在一个文件里。

## 3. Task Breakdown

### Task 1: Lock the `/entry` save contract before touching UI

**Files:**
- Modify: `src/server/services/sales-service.ts`
- Modify: `src/app/(member)/entry/form-state.ts`
- Modify: `src/app/(member)/entry/actions.ts`
- Create: `tests/unit/sales-entry-action.test.ts`
- Modify: `tests/unit/leaderboard-actions-revalidation.test.ts`

- [ ] **Step 1: Write the failing action contract test**

Create `tests/unit/sales-entry-action.test.ts` with cases for:

```ts
const formData = new FormData();
formData.set("saleDate", "2026-03-26");
formData.set("count40", "5");
formData.set("count60", "2");
formData.set("remark", "地推");

await expect(saveSalesEntryAction(undefined, formData)).resolves.toMatchObject({
  status: "success",
  summary: {
    saleDate: "2026-03-26",
    count40: 5,
    count60: 2,
    total: 7,
    isUpdate: false,
  },
});

await expect(saveSalesEntryAction({ status: "error" } as never, formData)).resolves.toMatchObject({
  status: "success",
  summary: {
    recoveredFromError: true,
  },
});
```

- [ ] **Step 2: Extend the revalidation test to use the new service return shape**

Update `tests/unit/leaderboard-actions-revalidation.test.ts` so the mocked service returns:

```ts
saveSalesRecordForUserMock.mockResolvedValue({
  isUpdate: true,
  record: {
    saleDate: new Date("2026-03-26T00:00:00.000Z"),
    count40: 1,
    count60: 2,
    remark: "",
    updatedAt: new Date("2026-03-26T08:00:00.000Z"),
  },
});
```

- [ ] **Step 3: Run the narrow unit tests and verify failure**

Run:

```bash
npm run test -- tests/unit/sales-entry-action.test.ts tests/unit/leaderboard-actions-revalidation.test.ts
```

Expected: FAIL because `SalesEntryFormState` and `saveSalesEntryAction` do not expose `summary` / `isUpdate`.

- [ ] **Step 4: Extend the service result type**

In `src/server/services/sales-service.ts`, change the save contract to return metadata:

```ts
export type SaveSalesRecordResult = {
  isUpdate: boolean;
  record: Awaited<ReturnType<typeof db.salesRecord.upsert>>;
};
```

Implement backend-side existence detection inside the service, not the client:

```ts
const existing = await db.salesRecord.findUnique({ ... });
const record = await db.salesRecord.upsert({ ... });

return {
  isUpdate: Boolean(existing),
  record,
};
```

- [ ] **Step 5: Expand form state and action mapping**

Update `src/app/(member)/entry/form-state.ts` to include a structured payload:

```ts
export type SalesEntrySummary = {
  saleDate: string;
  count40: number;
  count60: number;
  total: number;
  remark: string;
  savedAtIso: string;
  isUpdate: boolean;
  recoveredFromError: boolean;
};
```

Then map the service result in `src/app/(member)/entry/actions.ts`:

```ts
summary: {
  saleDate: saleDateToValue(record.saleDate),
  count40: record.count40,
  count60: record.count60,
  total: record.count40 + record.count60,
  remark: record.remark ?? "",
  savedAtIso: record.updatedAt.toISOString(),
  isUpdate,
  recoveredFromError: previousState?.status === "error",
}
```

Do not use `toISOString().slice(0, 10)` for user-facing business dates here; reuse the existing `saleDateToValue()` helper so the success card stays aligned with `Asia/Shanghai` business-day semantics.

- [ ] **Step 6: Re-run the entry contract tests**

Run:

```bash
npm run test -- tests/unit/sales-entry-action.test.ts tests/unit/leaderboard-actions-revalidation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review only the action/state/service changes. Do not commit unless the user explicitly asks.

### Task 2: Render the entry success card and pending/success UX

**Files:**
- Create: `src/components/sales-entry-success-card.tsx`
- Create: `src/components/sales-entry-page-client.tsx`
- Modify: `src/components/sales-entry-form.tsx`
- Modify: `src/app/(member)/entry/page.tsx`
- Create: `tests/unit/sales-entry-success-card.test.tsx`
- Modify: `tests/e2e/member-entry.spec.ts`

- [ ] **Step 1: Write the failing success-card unit test**

Create `tests/unit/sales-entry-success-card.test.tsx`:

```tsx
render(
  <SalesEntrySuccessCard
    summary={{
      saleDate: "2026-03-26",
      count40: 5,
      count60: 2,
      total: 7,
      remark: "地推",
      savedAtIso: "2026-03-26T08:15:00.000Z",
      isUpdate: true,
      recoveredFromError: false,
    }}
  />,
);

expect(screen.getByText("今日记录已更新")).toBeInTheDocument();
expect(screen.getByText("40 套餐数量")).toBeInTheDocument();
expect(screen.getByRole("link", { name: "查看我的记录" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "继续调整今天记录" })).toBeInTheDocument();
```

- [ ] **Step 2: Extend the member E2E flow to assert the richer confirmation UX**

Update `tests/e2e/member-entry.spec.ts` to cover:

- first save shows `今日记录已保存`
- card contains `40 套餐数量` / `60 套餐数量` / `总数`
- clicking save again with changed counts shows `今日记录已更新`

Suggested assertion shape:

```ts
await expect(page.getByText("今日记录已保存")).toBeVisible();
await expect(page.getByText("总数")).toBeVisible();

await page.getByLabel("40 套餐").fill("6");
await page.getByRole("button", { name: "保存今日记录" }).click();
await expect(page.getByText("今日记录已更新")).toBeVisible();
```

- [ ] **Step 3: Run the focused test set and verify failure**

Run:

```bash
npm run test -- tests/unit/sales-entry-success-card.test.tsx && npm run test:e2e -- tests/e2e/member-entry.spec.ts
```

Expected: FAIL because no success card exists and the current UI only shows a generic callout.

- [ ] **Step 4: Move action state into a page-level client wrapper**

Create `src/components/sales-entry-page-client.tsx` that owns:

```tsx
const [state, formAction, pending] = useActionState(saveSalesEntryAction, initialState);
```

The wrapper should render, in order:

1. existing `PageHeader`
2. success card when `state.summary` exists
3. the form card
4. the existing side callouts

Use `pending` to drive the “录入状态” metric card copy:

```tsx
value={pending ? "提交中" : state.summary?.isUpdate ? "已更新" : hasExistingRecord ? "待更新" : "待创建"}
```

- [ ] **Step 5: Turn `SalesEntryForm` into a presentational form**

Refactor `src/components/sales-entry-form.tsx` so it accepts:

```ts
type SalesEntryFormProps = {
  values: SalesEntryDefaults;
  status: SalesEntryFormState["status"];
  message: string | null;
  formAction: (payload: FormData) => void;
  pending: boolean;
  hasExistingRecord?: boolean;
};
```

The form should keep:

- existing labels and fields
- existing overwrite info callout
- error callout for `state.status === "error"`

It should stop owning `useActionState` internally.

- [ ] **Step 6: Implement the success card**

`src/components/sales-entry-success-card.tsx` should:

- switch title between `今日记录已保存` and `今日记录已更新`
- show `刚才的提交未成功，这次已经保存完成` when `recoveredFromError === true`
- show summary rows for:
  - 销售日期
  - 40 套餐数量
  - 60 套餐数量
  - 总数
  - 备注摘要
  - 保存时间
- render:
  - `Link` to `/records`
  - local button to dismiss the card / focus the form area

- [ ] **Step 7: Re-run the entry UX tests**

Run:

```bash
npm run test -- tests/unit/sales-entry-success-card.test.tsx tests/unit/sales-entry-action.test.ts && npm run test:e2e -- tests/e2e/member-entry.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review `/entry` on desktop and mobile for layout drift. Do not commit unless the user explicitly asks.

### Task 3: Build the cumulative stats service and shared cache contract

**Files:**
- Create: `src/server/services/cumulative-sales-stats-service.ts`
- Modify: `src/server/services/leaderboard-cache.ts`
- Create: `tests/unit/cumulative-sales-stats-service.test.ts`
- Modify: `tests/unit/leaderboard-cache.test.ts`

- [ ] **Step 1: Write the failing service tests**

Create `tests/unit/cumulative-sales-stats-service.test.ts` for the pure logic first:

```ts
expect(resolvePresetRange("MONTH", fixedNow)).toEqual({
  startDate: "2026-03-01",
  endDate: "2026-03-27",
  endExclusiveDate: "2026-03-28",
});

expect(resolvePresetRange("ROLLING_30", fixedNow)).toEqual({
  startDate: "2026-02-26",
  endDate: "2026-03-27",
  endExclusiveDate: "2026-03-28",
});

expect(selectTopMembers(rows, 5).map((row) => row.userName)).toEqual(["A", "B", "C"]);
expect(buildMonthlyTrendSeries(rows)[0].points[0].value).toBe(5);
```

Also cover:

- only `MEMBER` + active leaderboard-visible users are included
- member ranking uses `前 10 + 我的位置`
- `全历史 > 180 天` falls back to monthly points
- all range helpers use `Asia/Shanghai` + closed-open interval semantics

- [ ] **Step 2: Extend the cache test to cover the new readers**

Update `tests/unit/leaderboard-cache.test.ts` so it asserts:

- new cumulative readers are wrapped in `unstable_cache`
- `refreshLeaderboardCaches()` also revalidates `/admin`

- [ ] **Step 3: Run the cumulative unit tests and verify failure**

Run:

```bash
npm run test -- tests/unit/cumulative-sales-stats-service.test.ts tests/unit/leaderboard-cache.test.ts
```

Expected: FAIL because the service and cache readers do not exist yet.

- [ ] **Step 4: Implement the service as query + pure-transform helpers**

In `src/server/services/cumulative-sales-stats-service.ts`, separate the layers:

```ts
export function resolvePresetRange(...)
export function buildMemberCumulativeRanking(...)
export function buildTrendSeries(...)
export function downsampleMonthly(...)
export async function getMemberCumulativeRanking(...)
export async function getAdminCumulativeTrend(...)
```

Implementation rules:

- query `salesRecord` joined with `user`
- filter to `user.role === "MEMBER"`
- exclude inactive users if that is how existing leaderboard visibility works
- cumulative value is the sum of `count40` / `count60`, not the number of saved rows
- member ranking sorts by final cumulative value
- admin Top 5 is selected by final cumulative value before rendering the series
- resolve all preset boundaries in `Asia/Shanghai`
- use a closed-open query window:
  - `start >= range.startDate`
  - `saleDate < endExclusiveDate`
- for user-supplied `/leaderboard/range` filters, derive `endExclusiveDate` as “the next business day after `endDate`, at `00:00:00` Shanghai semantics”
- for `全历史`, query the earliest `salesRecord.saleDate`, normalize it through `saleDateToValue()`, and use that as `startDate`
- trend series must carry forward the previous cumulative value on dates/months without new records
- daily points mean “截至该日结束时的累计值”
- monthly points mean “截至该月最后一天结束时的累计值”
- keep the service API naming consistent with the cache wrappers:

```ts
getCachedMemberCumulativeRanking(...)
getCachedAdminCumulativeTrend(...)
```

Make the member-ranking output contract explicit:

```ts
type MemberCumulativeRow = {
  rank: number;
  userName: string;
  total: number;
  isCurrentUser: boolean;
  isMyPositionRow?: boolean;
  gapToPrevious?: number;
};
```

- [ ] **Step 5: Extend the shared cache module**

In `src/server/services/leaderboard-cache.ts`, add cached wrappers such as:

```ts
const cachedMemberCumulativeRanking = unstable_cache(...)
const cachedAdminCumulativeTrend = unstable_cache(...)
```

Keep the same tag/revalidate interval and extend the refresh helper:

```ts
revalidatePath("/admin");
```

- [ ] **Step 6: Re-run the cumulative service/cache tests**

Run:

```bash
npm run test -- tests/unit/cumulative-sales-stats-service.test.ts tests/unit/leaderboard-cache.test.ts
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review the date-range boundary logic carefully. Do not commit unless the user explicitly asks.

### Task 4: Integrate the member cumulative ranking block into `/leaderboard/range`

**Files:**
- Create: `src/components/cumulative-ranking-chart.tsx`
- Modify: `src/app/(shared)/leaderboard/range/page.tsx`
- Create: `tests/unit/cumulative-ranking-chart.test.tsx`
- Create: `tests/e2e/cumulative-stats.spec.ts`

- [ ] **Step 1: Write the failing ranking-chart test**

Create `tests/unit/cumulative-ranking-chart.test.tsx`:

```tsx
render(
  <CumulativeRankingChart
    title="本月累计买卡"
    rows={[
      { rank: 1, userName: "张三", total: 12, isCurrentUser: false },
      { rank: 11, userName: "member01", total: 4, isCurrentUser: true, gapToPrevious: 2 },
    ]}
  />,
);

expect(screen.getByText("本月累计买卡")).toBeInTheDocument();
expect(screen.getByText("我的位置")).toBeInTheDocument();
expect(screen.getByText("距离前一名 2")).toBeInTheDocument();
```

Add an empty-state assertion in the same file:

```tsx
render(<CumulativeRankingChart title="本月累计买卡" rows={[]} />);
expect(screen.getByText("当前时间范围内暂无累计买卡数据，可调整当前区间后查看")).toBeInTheDocument();
```

- [ ] **Step 2: Write the failing member cumulative E2E**

In `tests/e2e/cumulative-stats.spec.ts`, add a member scenario:

```ts
await page.goto("/leaderboard/range");
await loginAsMember(page);
await expect(page.getByText("本月累计买卡")).toBeVisible();
await expect(page.getByText("我的位置")).toBeVisible();
```

- [ ] **Step 3: Run the member ranking tests and verify failure**

Run:

```bash
npm run test -- tests/unit/cumulative-ranking-chart.test.tsx && npm run test:e2e -- tests/e2e/cumulative-stats.spec.ts
```

Expected: FAIL because the ranking component and page integration do not exist.

- [ ] **Step 4: Implement the member ranking component**

`src/components/cumulative-ranking-chart.tsx` should:

- render the Top rows as horizontal bars
- highlight the current user
- show a separated `我的位置` block when the current user is outside the top list
- render a non-crashing empty state when `rows.length === 0`
- use the subtitle copy `按全体成员累计数量统计`
- use the empty-state hint `当前时间范围内暂无累计买卡数据，可调整当前区间后查看`
- accept only precomputed props; no data fetching inside the component

- [ ] **Step 5: Update the range page data flow**

In `src/app/(shared)/leaderboard/range/page.tsx`:

- change the no-param default range from `today -> today` to `monthStart -> today`
- keep using explicit `startDate` / `endDate` from the existing form
- when `startDate` / `endDate` come from the existing form, convert `endDate` to the service’s `endExclusiveDate` with the same helper used by presets
- when `session?.user` exists, fetch member cumulative ranking using the same active range
- render the cumulative block above `LeaderboardTable`

Suggested server-page shape:

```tsx
const ranking = session?.user
  ? await getCachedMemberCumulativeRanking({ startDate, endDate, currentUserId: session.user.id })
  : null;
```

- [ ] **Step 6: Re-run the member cumulative tests**

Run:

```bash
npm run test -- tests/unit/cumulative-ranking-chart.test.tsx tests/unit/cumulative-sales-stats-service.test.ts && npm run test:e2e -- tests/e2e/cumulative-stats.spec.ts --grep "member"
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review the anonymous `/leaderboard/range` experience to ensure no broken null-state rendering. Do not commit unless the user explicitly asks.

### Task 5: Integrate the admin cumulative trend panel

**Files:**
- Create: `src/components/cumulative-trend-chart.tsx`
- Create: `src/components/admin/admin-cumulative-stats-panel.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Create: `tests/unit/cumulative-trend-chart.test.tsx`
- Modify: `tests/e2e/cumulative-stats.spec.ts`

- [ ] **Step 1: Write the failing admin trend-chart test**

Create `tests/unit/cumulative-trend-chart.test.tsx`:

```tsx
render(
  <CumulativeTrendChart
    title="成员累计买卡趋势"
    series={[
      { userName: "张三", points: [{ label: "03-01", value: 1 }, { label: "03-02", value: 3 }] },
      { userName: "李四", points: [{ label: "03-01", value: 2 }, { label: "03-02", value: 4 }] },
    ]}
  />,
);

expect(screen.getByLabelText("成员累计买卡趋势")).toBeInTheDocument();
expect(screen.getByText("张三")).toBeInTheDocument();
```

Add an empty-state assertion:

```tsx
render(<CumulativeTrendChart title="成员累计买卡趋势" series={[]} />);
expect(screen.getByText("当前筛选条件下暂无累计买卡数据")).toBeInTheDocument();
```

- [ ] **Step 2: Extend the cumulative E2E with the admin scenario**

Add an admin path to `tests/e2e/cumulative-stats.spec.ts`:

```ts
await page.goto("/admin");
await loginAsAdmin(page);
await expect(page.getByText("成员累计买卡趋势")).toBeVisible();
await page.getByRole("button", { name: "近 30 天" }).click();
await page.getByRole("button", { name: "60 套餐" }).click();
await expect(page.getByText("Top 成员")).toBeVisible();
```

- [ ] **Step 3: Run the admin cumulative tests and verify failure**

Run:

```bash
npm run test -- tests/unit/cumulative-trend-chart.test.tsx && npm run test:e2e -- tests/e2e/cumulative-stats.spec.ts --grep "admin"
```

Expected: FAIL because the admin panel, controls, and chart do not exist.

- [ ] **Step 4: Implement the SVG trend chart and admin panel**

`src/components/cumulative-trend-chart.tsx` should stay presentational:

```tsx
<svg aria-label={title} viewBox="0 0 640 280">
  {series.map((line) => (
    <polyline key={line.userName} points={buildPolyline(line.points)} />
  ))}
</svg>
```

`src/components/admin/admin-cumulative-stats-panel.tsx` should render:

- title
- preset controls: `本月` / `近 30 天` / `全历史`
- metric controls: `总量` / `40 套餐` / `60 套餐`
- Top 成员摘要
- the trend chart
- the spec-required empty state when the current preset/metric has no data

Drive `preset` / `metric` changes with a GET form so the server page can stay URL-driven:

```tsx
<form method="get">
  <input type="hidden" name="metric" value={metric} />
  <button type="submit" name="preset" value="ROLLING_30">近 30 天</button>
</form>
```

Do the inverse for the metric group:

```tsx
<form method="get">
  <input type="hidden" name="preset" value={preset} />
  <button type="submit" name="metric" value="PLAN_60">60 套餐</button>
</form>
```

- [ ] **Step 5: Wire the admin home page**

Update `src/app/(admin)/admin/page.tsx` so it reads search params and fetches cached admin stats:

```tsx
type AdminHomePageProps = {
  searchParams?: Promise<{ preset?: string; metric?: string }>;
};
```

Parse and validate both params before rendering:

```ts
const preset = parsePreset(params?.preset);
const metric = parseMetric(params?.metric);
```

Render the cumulative stats panel above the existing quick-entry cards. Do not remove the current module grid.

- [ ] **Step 6: Re-run the admin cumulative tests**

Run:

```bash
npm run test -- tests/unit/cumulative-trend-chart.test.tsx tests/unit/cumulative-sales-stats-service.test.ts tests/unit/leaderboard-cache.test.ts && npm run test:e2e -- tests/e2e/cumulative-stats.spec.ts --grep "admin"
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review `全历史` over a long range to confirm the monthly downsampling branch is actually exercised. Do not commit unless the user explicitly asks.

### Task 6: Run verification and update handoff

**Files:**
- Modify: `docs/ai/handoff.md`

- [ ] **Step 1: Update the handoff document**

Add:

- `/entry` success-card scope
- member `/leaderboard/range` cumulative block
- admin `/admin` cumulative trend panel
- cache invalidation note for `/admin`

- [ ] **Step 2: Run the targeted verification set**

Run:

```bash
npm run test -- \
  tests/unit/sales-entry-action.test.ts \
  tests/unit/sales-entry-success-card.test.tsx \
  tests/unit/cumulative-sales-stats-service.test.ts \
  tests/unit/cumulative-ranking-chart.test.tsx \
  tests/unit/cumulative-trend-chart.test.tsx \
  tests/unit/leaderboard-actions-revalidation.test.ts \
  tests/unit/leaderboard-cache.test.ts

npm run test:e2e -- tests/e2e/member-entry.spec.ts tests/e2e/cumulative-stats.spec.ts
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
  - long-range trend readability
  - member “我的位置” spacing on small screens
  - `/entry` success card density with long remarks

Do not commit unless the user explicitly asks.
