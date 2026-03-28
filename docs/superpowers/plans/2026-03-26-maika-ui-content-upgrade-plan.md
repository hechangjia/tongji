# Maika UI And Content Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动现有销售、卡酬、结算业务规则的前提下，完成全站前端产品化升级，并新增登录后全站可见的横幅一言与全体公告系统。

**Architecture:** 保持现有 `Next.js App Router + Prisma + PostgreSQL + Auth.js` 单仓结构。前端部分通过共享壳层重构、统一 UI 原语和页面级改造完成视觉升级；内容系统部分通过新增 Prisma 模型、独立服务层、独立后台入口和壳层统一接入完成。横幅一言与公告分别建模，不做统一内容中心。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, Auth.js, Zod, Vitest, Playwright

---

## 0. Preconditions

- 执行前先阅读本地 Next.js 16 文档，重点确认 `App Router layout`、`next/font`、客户端组件边界和当前 `proxy.ts` 约定。
- 保持现有业务规则不变：
  - 角色固定 `MEMBER / ADMIN`
  - 套餐固定 `40 / 60`
  - `userId + saleDate` 唯一
  - 缺失卡酬规则必须显式标记，不能默认 `0`
- 本仓库当前不自动 `git commit`。以下任务中的“Checkpoint”仅表示应检查 diff；只有用户明确要求时才执行提交。
- 执行阶段建议同时使用：
  - `@superpowers:test-driven-development`
  - `@superpowers:verification-before-completion`

## 1. Scope Check

本 spec 包含两个子系统：

1. 全站 UI/导航/交互升级
2. 内容系统（横幅一言 + 全体公告）

两者共享 `AppShell`、共享页面头部和共享登录后内容区域，且需要一起验证，因此保持为同一份执行计划，但按任务拆开。

## 2. File Map

### Shared Shell / UI Foundation

- Modify: `src/app/globals.css` — 主题变量、背景、渐变、动效、公用视觉 token
- Modify: `src/app/layout.tsx` — 根布局背景、字体、全局 body 样式
- Modify: `src/components/app-shell.tsx` — 服务端壳层包装、内容加载、导航入口汇总
- Create: `src/components/app-shell-client.tsx` — 移动端抽屉、桌面侧栏、壳层交互
- Create: `src/components/page-header.tsx` — 页面头部通用组件
- Create: `src/components/metric-card.tsx` — 数据卡片
- Create: `src/components/status-callout.tsx` — 成功/警告/错误提示块
- Create: `src/components/empty-state.tsx` — 空态块

### Existing Page Refresh

- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/login-form.tsx`
- Modify: `src/app/(member)/entry/page.tsx`
- Modify: `src/components/sales-entry-form.tsx`
- Modify: `src/app/(member)/records/page.tsx`
- Modify: `src/components/my-records-table.tsx`
- Modify: `src/app/(shared)/leaderboard/daily/page.tsx`
- Modify: `src/app/(shared)/leaderboard/range/page.tsx`
- Modify: `src/components/leaderboard-table.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/members/page.tsx`
- Modify: `src/app/(admin)/admin/sales/page.tsx`
- Modify: `src/app/(admin)/admin/commission-rules/page.tsx`
- Modify: `src/app/(admin)/admin/settlements/page.tsx`
- Modify: `src/components/admin/member-form.tsx`
- Modify: `src/components/admin/member-table.tsx`
- Modify: `src/components/admin/sales-table.tsx`
- Modify: `src/components/admin/commission-rule-form.tsx`
- Modify: `src/components/admin/commission-rule-table.tsx`
- Modify: `src/components/admin/settlement-table.tsx`

### Content System

- Modify: `prisma/schema.prisma` — 新增横幅与公告模型
- Modify: `prisma/seed.ts` — 内置一言、默认横幅配置、示例公告
- Create: `src/lib/validators/banner.ts` — 横幅一言校验
- Create: `src/lib/validators/announcement.ts` — 公告校验
- Create: `src/server/services/banner-service.ts` — 横幅读取、展示模式、管理逻辑
- Create: `src/server/services/announcement-service.ts` — 公告可见性与管理逻辑
- Create: `src/components/banner-rotator.tsx` — 横幅短文案展示
- Create: `src/components/announcement-list.tsx` — 公告摘要展示

### Admin Content Routes

- Create: `src/app/(admin)/admin/banners/page.tsx`
- Create: `src/app/(admin)/admin/banners/actions.ts`
- Create: `src/app/(admin)/admin/banners/form-state.ts`
- Create: `src/components/admin/banner-form.tsx`
- Create: `src/components/admin/banner-settings-form.tsx`
- Create: `src/components/admin/banner-table.tsx`
- Create: `src/app/(admin)/admin/announcements/page.tsx`
- Create: `src/app/(admin)/admin/announcements/actions.ts`
- Create: `src/app/(admin)/admin/announcements/form-state.ts`
- Create: `src/components/admin/announcement-form.tsx`
- Create: `src/components/admin/announcement-table.tsx`

### Tests / Docs

- Modify: `tests/unit/app-shell.test.tsx`
- Create: `tests/unit/leaderboard-table.test.tsx`
- Create: `tests/unit/content-validators.test.ts`
- Create: `tests/unit/banner-service.test.ts`
- Create: `tests/unit/announcement-service.test.ts`
- Modify: `tests/e2e/login.spec.ts`
- Modify: `tests/e2e/member-entry.spec.ts`
- Modify: `tests/e2e/admin-settlement.spec.ts`
- Create: `tests/e2e/content-publishing.spec.ts`
- Modify: `README.md`
- Modify: `docs/ai/handoff.md`

## 3. Data Shapes To Lock In First

### Prisma

```prisma
enum ContentStatus {
  ACTIVE
  INACTIVE
}

enum BannerSourceType {
  BUILTIN
  CUSTOM
}

enum BannerDisplayMode {
  RANDOM
  ROTATE
}

model BannerQuote {
  id         String           @id @default(cuid())
  content    String
  author     String?
  sourceType BannerSourceType @default(CUSTOM)
  status     ContentStatus    @default(ACTIVE)
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
}

model BannerSettings {
  id          String            @id
  isEnabled   Boolean           @default(true)
  displayMode BannerDisplayMode @default(RANDOM)
  updatedAt   DateTime          @updatedAt
}

model Announcement {
  id        String        @id @default(cuid())
  title     String
  content   String
  isPinned  Boolean       @default(false)
  status    ContentStatus @default(ACTIVE)
  publishAt DateTime      @default(now())
  expireAt  DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}
```

### Service Interfaces

```ts
type ShellBanner = {
  content: string;
  author?: string | null;
  mode: "RANDOM" | "ROTATE";
};

type VisibleAnnouncement = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishAt: Date;
  expireAt: Date | null;
};
```

## 4. Task Breakdown

### Task 1: Rebuild the shared shell and theme foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/app-shell.tsx`
- Create: `src/components/app-shell-client.tsx`
- Create: `src/components/page-header.tsx`
- Create: `src/components/metric-card.tsx`
- Create: `src/components/status-callout.tsx`
- Create: `src/components/empty-state.tsx`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Expand the failing shell test**

```tsx
render(
  <AppShellClient
    role="ADMIN"
    userName="admin"
    currentPath="/admin"
    banner={null}
    announcements={[]}
  >
    <div>内容</div>
  </AppShellClient>,
);

expect(screen.getByText("成员区")).toBeInTheDocument();
expect(screen.getByText("管理区")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "打开导航菜单" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run:

```bash
npm run test -- tests/unit/app-shell.test.tsx
```

Expected: FAIL because grouped nav, content slots, or mobile trigger are not implemented.

- [ ] **Step 3: Add global theme tokens and shared motion styles**

Implement in `src/app/globals.css`:

```css
:root {
  --maika-ink: #082f49;
  --maika-surface: rgba(255, 255, 255, 0.82);
  --maika-accent: #67e8f9;
  --maika-ring: #bae6fd;
}

@keyframes maika-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 4: Refactor the shell into server wrapper + client chrome**

Create `src/components/app-shell-client.tsx` and keep `src/components/app-shell.tsx` as the server wrapper that prepares:

```ts
type NavSection = {
  title: string;
  items: Array<{ label: string; href: string }>;
};
```

The client chrome must support:

- desktop left sidebar
- mobile top bar + drawer
- grouped nav sections
- shell content slots above the page body

- [ ] **Step 5: Add reusable page primitives**

Create:

- `PageHeader`
- `MetricCard`
- `StatusCallout`
- `EmptyState`

Each component should accept plain props and no domain-specific behavior.

- [ ] **Step 6: Re-run the shell unit test**

Run:

```bash
npm run test -- tests/unit/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Run a narrow lint/type checkpoint**

Run:

```bash
npm run lint -- src/app/layout.tsx src/components/app-shell.tsx src/components/app-shell-client.tsx src/components/page-header.tsx src/components/metric-card.tsx src/components/status-callout.tsx src/components/empty-state.tsx tests/unit/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review only the shell/theme files changed in this task. Do not commit unless the user explicitly asks.

### Task 2: Refresh login, member pages, and leaderboard pages

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/login-form.tsx`
- Modify: `src/app/(member)/entry/page.tsx`
- Modify: `src/components/sales-entry-form.tsx`
- Modify: `src/app/(member)/records/page.tsx`
- Modify: `src/components/my-records-table.tsx`
- Modify: `src/app/(shared)/leaderboard/daily/page.tsx`
- Modify: `src/app/(shared)/leaderboard/range/page.tsx`
- Modify: `src/components/leaderboard-table.tsx`
- Create: `tests/unit/leaderboard-table.test.tsx`
- Modify: `tests/e2e/login.spec.ts`
- Modify: `tests/e2e/member-entry.spec.ts`

- [ ] **Step 1: Write the failing leaderboard and flow assertions**

Add a new table test:

```tsx
render(<LeaderboardTable rows={rows} title="日榜" />);
expect(screen.getByText("TOP 1")).toBeInTheDocument();

render(
  <LeaderboardTable
    rows={[]}
    title="日榜"
    emptyText="当前时间范围内暂无数据，建议切换日期后重试"
  />,
);
expect(screen.getByText("当前时间范围内暂无数据，建议切换日期后重试")).toBeInTheDocument();
```

Extend Playwright checks to cover:

- login hero copy visible
- redesigned entry page header visible
- success feedback still visible after save

- [ ] **Step 2: Run the narrow unit + E2E tests and verify failure**

Run:

```bash
npm run test -- tests/unit/leaderboard-table.test.tsx && npm run test:e2e -- tests/e2e/login.spec.ts tests/e2e/member-entry.spec.ts
```

Expected: FAIL because the new UI copy and leaderboard structure do not exist yet.

- [ ] **Step 3: Redesign the login page and login form**

Implement:

- split hero + login card layout
- stronger background/gradient treatment
- consistent error state
- same labels and submit semantics so existing auth behavior stays untouched

- [ ] **Step 4: Upgrade the member entry and records pages**

Use the shared primitives to add:

- page hero
- rules/status side card
- richer success/error/overwrite feedback
- stronger empty state for records

- [ ] **Step 5: Upgrade daily/range leaderboard pages**

Implement:

- top metric cards
- clearer filter toolbar
- top-3 emphasis
- explicit empty-state suggestions
- more visible export button for admins

- [ ] **Step 6: Re-run the task test set**

Run:

```bash
npm run test -- tests/unit/leaderboard-table.test.tsx && npm run test:e2e -- tests/e2e/login.spec.ts tests/e2e/member-entry.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review public/member pages for accidental business-logic drift. Do not commit unless the user explicitly asks.

### Task 3: Refresh the admin suite

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/members/page.tsx`
- Modify: `src/app/(admin)/admin/sales/page.tsx`
- Modify: `src/app/(admin)/admin/commission-rules/page.tsx`
- Modify: `src/app/(admin)/admin/settlements/page.tsx`
- Modify: `src/components/admin/member-form.tsx`
- Modify: `src/components/admin/member-table.tsx`
- Modify: `src/components/admin/sales-table.tsx`
- Modify: `src/components/admin/commission-rule-form.tsx`
- Modify: `src/components/admin/commission-rule-table.tsx`
- Modify: `src/components/admin/settlement-table.tsx`
- Modify: `tests/e2e/admin-settlement.spec.ts`

- [ ] **Step 1: Extend the settlement flow to fail on missing new UI affordances**

Add assertions for:

- visible export action
- visible status tag for settlement state
- new page header copy or summary card

- [ ] **Step 2: Run the admin E2E and verify failure**

Run:

```bash
npm run test:e2e -- tests/e2e/admin-settlement.spec.ts
```

Expected: FAIL because the upgraded admin UI structure is not in place yet.

- [ ] **Step 3: Replace the admin home placeholder with a real dashboard entry page**

Implement quick-entry cards for:

- 成员管理
- 销售记录
- 卡酬规则
- 结算

- [ ] **Step 4: Upgrade members, sales, commission, and settlements pages**

Implement:

- stronger page headers
- separated filter/toolbar areas
- clearer row states and secondary metadata
- empty states that suggest the next action

- [ ] **Step 5: Re-run the admin E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/admin-settlement.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Checkpoint the diff**

Review admin pages for layout regressions on desktop and mobile. Do not commit unless the user explicitly asks.

### Task 4: Add schema, validators, and seed data for the content systems

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `src/lib/validators/banner.ts`
- Create: `src/lib/validators/announcement.ts`
- Modify: `tests/unit/prisma-schema-contract.test.ts`
- Create: `tests/unit/content-validators.test.ts`

- [ ] **Step 1: Write failing schema and validator tests**

Add schema assertions:

```ts
expect(schema).toContain("model BannerQuote");
expect(schema).toContain("model BannerSettings");
expect(schema).toContain("model Announcement");
```

Add validator coverage for:

- banner content required
- announcement title/content required
- `expireAt` must be after `publishAt`

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts tests/unit/content-validators.test.ts
```

Expected: FAIL because the models and validators do not exist.

- [ ] **Step 3: Extend Prisma schema with banner and announcement models**

Add:

- `ContentStatus`
- `BannerSourceType`
- `BannerDisplayMode`
- `BannerQuote`
- `BannerSettings`
- `Announcement`

- [ ] **Step 4: Seed built-in quotes, default settings, and one sample announcement**

In `prisma/seed.ts`, ensure re-runs are idempotent:

```ts
await prisma.bannerSettings.upsert({
  where: { id: "default" },
  update: {},
  create: { id: "default", isEnabled: true, displayMode: "RANDOM" },
});
```

- [ ] **Step 5: Add banner and announcement Zod validators**

Keep them consistent with current validator style:

- trim text
- enforce required fields
- validate publish/expire ordering
- keep first version text-only

- [ ] **Step 6: Run schema + validator verification**

Run:

```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts tests/unit/content-validators.test.ts && npx prisma validate && npx prisma db push && npx prisma db seed
```

Expected: PASS.

- [ ] **Step 7: Checkpoint the diff**

Review schema naming and seed idempotency before moving on. Do not commit unless the user explicitly asks.

### Task 5: Implement banner quote management and shell banner rendering

**Files:**
- Create: `src/server/services/banner-service.ts`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Create: `src/components/banner-rotator.tsx`
- Create: `src/app/(admin)/admin/banners/page.tsx`
- Create: `src/app/(admin)/admin/banners/actions.ts`
- Create: `src/app/(admin)/admin/banners/form-state.ts`
- Create: `src/components/admin/banner-form.tsx`
- Create: `src/components/admin/banner-settings-form.tsx`
- Create: `src/components/admin/banner-table.tsx`
- Create: `tests/unit/banner-service.test.ts`
- Modify: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write failing banner service tests**

Cover:

- returns `null` when banner is disabled or no active quotes exist
- returns one active quote in `RANDOM` mode
- returns stable ordered output for `ROTATE` mode input preparation

Example:

```ts
expect(pickBannerQuote([], { isEnabled: true, displayMode: "RANDOM" })).toBeNull();
```

- [ ] **Step 2: Run the banner unit tests and verify failure**

Run:

```bash
npm run test -- tests/unit/banner-service.test.ts tests/unit/app-shell.test.tsx
```

Expected: FAIL because the service and shell banner slot do not exist.

- [ ] **Step 3: Implement `banner-service.ts`**

Expose functions similar to:

```ts
export async function getBannerShellData(): Promise<ShellBanner | null>;
export async function listBannerQuotes(): Promise<BannerQuoteRow[]>;
export async function saveBannerQuote(input: BannerInput): Promise<void>;
export async function updateBannerSettings(input: BannerSettingsInput): Promise<void>;
```

- [ ] **Step 4: Build the admin banners route and components**

The page must include:

- quote creation form
- settings form (`isEnabled`, `displayMode`)
- table/list for existing quotes with active/inactive state

- [ ] **Step 5: Add the banners management entry to the admin home**

Extend the Task 3 admin dashboard to include a card linking to `/admin/banners`.

- [ ] **Step 6: Render the banner strip in the authenticated shell**

Rules:

- show only for authenticated pages inside `AppShell`
- skip `/login`
- do not show for anonymous leaderboard visits

- [ ] **Step 7: Re-run banner-related unit tests**

Run:

```bash
npm run test -- tests/unit/banner-service.test.ts tests/unit/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Checkpoint the diff**

Review shell banner rendering on both desktop and mobile. Do not commit unless the user explicitly asks.

### Task 6: Implement announcement management and shell announcement rendering

**Files:**
- Create: `src/server/services/announcement-service.ts`
- Create: `src/components/announcement-list.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Create: `src/app/(admin)/admin/announcements/page.tsx`
- Create: `src/app/(admin)/admin/announcements/actions.ts`
- Create: `src/app/(admin)/admin/announcements/form-state.ts`
- Create: `src/components/admin/announcement-form.tsx`
- Create: `src/components/admin/announcement-table.tsx`
- Create: `tests/unit/announcement-service.test.ts`
- Create: `tests/e2e/content-publishing.spec.ts`

- [ ] **Step 1: Write failing announcement tests**

Service tests must cover:

- only `ACTIVE` announcements are visible
- future `publishAt` items are hidden
- expired items are hidden
- pinned items sort ahead of non-pinned items

Example:

```ts
expect(sortVisibleAnnouncements(rows)[0].isPinned).toBe(true);
```

- [ ] **Step 2: Run the announcement test set and verify failure**

Run:

```bash
npm run test -- tests/unit/announcement-service.test.ts && npm run test:e2e -- tests/e2e/content-publishing.spec.ts
```

Expected: FAIL because the service, routes, and E2E flow do not exist.

- [ ] **Step 3: Implement `announcement-service.ts`**

Expose functions similar to:

```ts
export async function getVisibleAnnouncements(now = new Date()): Promise<VisibleAnnouncement[]>;
export async function listAnnouncementsForAdmin(): Promise<AnnouncementRow[]>;
export async function saveAnnouncement(input: AnnouncementInput): Promise<void>;
```

- [ ] **Step 4: Build the admin announcements route and components**

The page must support:

- create/update announcement
- set pinned flag
- set publish time
- set optional expire time
- enable/disable rows

- [ ] **Step 5: Add the announcements management entry to the admin home**

Extend the admin dashboard to include a card linking to `/admin/announcements`.

- [ ] **Step 6: Render announcement summary block in the shell**

Rules:

- show below the banner strip
- show pinned items first
- omit the block entirely when there are no visible announcements

- [ ] **Step 7: Write the end-to-end publishing flow**

The Playwright test should:

1. sign in as admin
2. create or enable one banner quote
3. create one pinned announcement with current publish time
4. sign in as member
5. assert the shell shows both the banner and the announcement

- [ ] **Step 8: Re-run the announcement test set**

Run:

```bash
npm run test -- tests/unit/announcement-service.test.ts && npm run test:e2e -- tests/e2e/content-publishing.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Checkpoint the diff**

Review visibility and scheduling logic carefully. Do not commit unless the user explicitly asks.

### Task 7: Run full verification, update docs, and prepare handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/ai/handoff.md`

- [ ] **Step 1: Update README for the new UX and content features**

Document:

- redesigned shell/navigation
- new admin routes:
  - `/admin/banners`
  - `/admin/announcements`
- banner quote behavior
- announcement scheduling behavior

- [ ] **Step 2: Update the handoff document**

Add:

- completed UI upgrade scope
- completed content system scope
- new key constraints
- any deployment or seed caveats

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run test:e2e
npm run build
npx prisma validate
```

Expected: PASS.

- [ ] **Step 4: Perform manual browser QA**

Check at minimum:

- desktop shell nav
- mobile drawer nav
- login page
- member entry save flow
- leaderboard empty state and top-3 styling
- admin banners page
- admin announcements page
- member view of banner + pinned announcement

- [ ] **Step 5: Final checkpoint**

Summarize:

- files changed
- tests run
- any residual risks

Do not commit unless the user explicitly asks.

## 5. Residual Risks To Watch During Execution

- `AppShell` server/client split can accidentally break existing tests if the tested export changes; keep `app-shell.test.tsx` focused on the client chrome if needed.
- `ROTATE` mode should not rely on per-request server memory for position if predictable rotation is required; first version can safely render a client rotator from the active quote list.
- Date handling for announcements must remain timezone-safe. Use explicit comparisons and reuse the existing date formatting conventions.
- UI polish must not break Playwright label-based selectors. Keep labels like `账号`, `密码`, `40 套餐`, `60 套餐`, `开始日期`, `结束日期` intact.

## 6. Definition Of Done

- 全站壳层、导航、视觉层和交互反馈升级完成
- 所有既有业务页面仍可正常工作
- 横幅一言系统可在后台管理，并在登录后全站显示
- 公告系统可在后台管理，并按置顶/发布时间/过期时间正确显示
- 自动化验证和人工关键路径验证通过
- `README.md` 与 `docs/ai/handoff.md` 已同步
