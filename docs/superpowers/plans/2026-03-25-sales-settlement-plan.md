# 校园电话卡销售统计与卡酬结算系统 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可部署到 Vercel 的响应式网页 MVP，支持成员登录、每日录入、历史记录、日榜、总榜、成员管理、销售记录管理、卡酬规则、自动结算与 Excel 导出。

**Architecture:** 使用单仓 `Next.js App Router` 项目同时承载页面与服务端逻辑。所有业务数据存入 `PostgreSQL`，由 `Prisma` 访问；认证使用账号密码 + 角色权限控制；排行榜、结算和 Excel 导出全部基于数据库中的规范化数据实时计算，避免重复存储业务结果。

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Auth.js Credentials, Zod, Vitest, Playwright, ExcelJS, Vercel, Cloudflare DNS

---

## 0. Preconditions

- 当前目录尚未初始化为 Git 仓库。开始执行本计划前先运行：
  - `git init`
  - `git branch -m main`
- 当前目录为空目录。计划按“从零搭建项目”编写。
- 推荐包管理器使用 `npm`，避免额外环境依赖。
- 推荐数据库使用 `Neon Postgres`（Vercel 连接最顺），但业务层只依赖标准 PostgreSQL。

## 1. Planned File Structure

### Root / Config
- Create: `package.json` — 项目依赖与脚本
- Create: `next.config.ts` — Next.js 配置
- Create: `tsconfig.json` — TypeScript 配置
- Create: `postcss.config.mjs` — Tailwind/PostCSS 配置
- Create: `eslint.config.mjs` — ESLint 配置
- Create: `.gitignore` — Git 忽略规则
- Create: `.env.example` — 环境变量样例
- Create: `middleware.ts` — 登录态与角色路由保护
- Create: `vitest.config.ts` — 单元测试配置
- Create: `playwright.config.ts` — E2E 测试配置

### Database / Server
- Create: `prisma/schema.prisma` — 数据库模型定义
- Create: `prisma/seed.ts` — 初始管理员与示例成员数据
- Create: `src/lib/db.ts` — Prisma Client 单例
- Create: `src/lib/env.ts` — 环境变量读取与校验
- Create: `src/lib/auth.ts` — Auth.js 配置与会话导出
- Create: `src/lib/permissions.ts` — `requireAuth` / `requireAdmin`
- Create: `src/lib/validators/auth.ts` — 登录表单校验
- Create: `src/lib/validators/sales.ts` — 销售记录校验
- Create: `src/lib/validators/member.ts` — 成员管理校验
- Create: `src/lib/validators/commission.ts` — 卡酬规则校验
- Create: `src/lib/validators/settlement.ts` — 结算查询校验
- Create: `src/server/services/sales-service.ts` — 销售记录写入/查询逻辑
- Create: `src/server/services/leaderboard-service.ts` — 日榜/总榜聚合逻辑
- Create: `src/server/services/commission-service.ts` — 规则写入与冲突检查
- Create: `src/server/services/settlement-service.ts` — 结算金额计算
- Create: `src/server/services/export-service.ts` — ExcelJS 导出逻辑

### App Router Pages / API
- Create: `src/app/layout.tsx` — 根布局
- Create: `src/app/globals.css` — 全局样式
- Create: `src/app/page.tsx` — 根路径重定向
- Create: `src/app/(auth)/login/page.tsx` — 登录页
- Create: `src/app/(member)/entry/page.tsx` — 成员每日录入页
- Create: `src/app/(member)/records/page.tsx` — 成员历史记录页
- Create: `src/app/(shared)/leaderboard/daily/page.tsx` — 日榜页
- Create: `src/app/(shared)/leaderboard/range/page.tsx` — 总榜页
- Create: `src/app/(admin)/admin/members/page.tsx` — 成员管理页
- Create: `src/app/(admin)/admin/sales/page.tsx` — 销售记录管理页
- Create: `src/app/(admin)/admin/commission-rules/page.tsx` — 卡酬规则页
- Create: `src/app/(admin)/admin/settlements/page.tsx` — 结算页
- Create: `src/app/api/auth/[...nextauth]/route.ts` — Auth.js 路由
- Create: `src/app/api/export/daily/route.ts` — 日榜导出
- Create: `src/app/api/export/range/route.ts` — 总榜导出
- Create: `src/app/api/export/settlement/route.ts` — 结算导出

### UI Components
- Create: `src/components/app-shell.tsx` — 顶部导航与布局壳
- Create: `src/components/login-form.tsx` — 登录表单
- Create: `src/components/sales-entry-form.tsx` — 每日录入表单
- Create: `src/components/my-records-table.tsx` — 成员历史记录表
- Create: `src/components/leaderboard-table.tsx` — 榜单表格
- Create: `src/components/admin/member-form.tsx` — 成员表单
- Create: `src/components/admin/member-table.tsx` — 成员表格
- Create: `src/components/admin/sales-table.tsx` — 销售记录表格
- Create: `src/components/admin/commission-rule-form.tsx` — 规则表单
- Create: `src/components/admin/commission-rule-table.tsx` — 规则表格
- Create: `src/components/admin/settlement-table.tsx` — 结算结果表格

### Tests
- Create: `tests/unit/auth.test.ts`
- Create: `tests/unit/sales-service.test.ts`
- Create: `tests/unit/leaderboard-service.test.ts`
- Create: `tests/unit/commission-service.test.ts`
- Create: `tests/unit/settlement-service.test.ts`
- Create: `tests/unit/export-service.test.ts`
- Create: `tests/e2e/login.spec.ts`
- Create: `tests/e2e/member-entry.spec.ts`
- Create: `tests/e2e/admin-settlement.spec.ts`

## 2. Implementation Tasks

### Task 1: Bootstrap the Next.js project and test harness

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Test: `tests/unit/app-shell-smoke.test.tsx`

- [ ] **Step 1: Scaffold the app skeleton**

Run:
```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: `package.json`, `src/app`, `next.config.ts`, `tsconfig.json` are created.

- [ ] **Step 2: Add test dependencies and scripts**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom playwright @playwright/test
```
Then update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

test('home page redirects to login or entry', () => {
  render(<HomePage />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

- [ ] **Step 4: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/app-shell-smoke.test.tsx
```
Expected: FAIL with module import or page behavior mismatch.

- [ ] **Step 5: Implement the minimal page and test config**

```tsx
export default function HomePage() {
  return <main>Loading...</main>
}
```

- [ ] **Step 6: Run unit tests**

Run:
```bash
npm run test -- tests/unit/app-shell-smoke.test.tsx
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json next.config.ts tsconfig.json src/app vitest.config.ts playwright.config.ts tests/unit/app-shell-smoke.test.tsx
git commit -m "chore: bootstrap nextjs app and test harness"
```

### Task 2: Model the database and Prisma client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `.env.example`
- Test: `tests/unit/prisma-schema-contract.test.ts`

- [ ] **Step 1: Write the failing schema contract test**

```ts
import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

describe('prisma schema', () => {
  test('contains core models', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8')
    expect(schema).toContain('model User')
    expect(schema).toContain('model SalesRecord')
    expect(schema).toContain('model CommissionRule')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts
```
Expected: FAIL because `prisma/schema.prisma` does not exist.

- [ ] **Step 3: Define minimal Prisma schema**

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  name         String
  role         Role
  status       UserStatus @default(ACTIVE)
  salesRecords SalesRecord[]
  commissionRules CommissionRule[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SalesRecord {
  id        String   @id @default(cuid())
  userId    String
  saleDate  DateTime
  count40   Int
  count60   Int
  remark    String?
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, saleDate])
}
```

- [ ] **Step 4: Add remaining models, env example, and Prisma client singleton**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as { prisma?: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 5: Run unit test and Prisma validation**

Run:
```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts && npx prisma validate
```
Expected: PASS and `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 6: Create and document seed data**

```ts
await prisma.user.upsert({
  where: { username: 'admin' },
  update: {},
  create: { username: 'admin', passwordHash, name: '系统管理员', role: 'ADMIN' }
})
```

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/lib/db.ts .env.example tests/unit/prisma-schema-contract.test.ts
git commit -m "feat: add prisma schema and seed data"
```

### Task 3: Implement credentials authentication and role guards

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/permissions.ts`
- Create: `middleware.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/components/login-form.tsx`
- Test: `tests/unit/auth.test.ts`
- Test: `tests/e2e/login.spec.ts`

- [ ] **Step 1: Write the failing auth unit test**

```ts
import { describe, expect, test } from 'vitest'
import { canAccessAdmin } from '@/lib/permissions'

describe('permissions', () => {
  test('member cannot access admin routes', () => {
    expect(canAccessAdmin({ role: 'MEMBER' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run unit test to verify it fails**

Run:
```bash
npm run test -- tests/unit/auth.test.ts
```
Expected: FAIL because `@/lib/permissions` does not exist.

- [ ] **Step 3: Implement role helpers and Auth.js config**

```ts
export function canAccessAdmin(session: { role: 'ADMIN' | 'MEMBER' }) {
  return session.role === 'ADMIN'
}
```

```ts
Credentials({
  credentials: { username: {}, password: {} },
  async authorize(credentials) {
    const user = await db.user.findUnique({ where: { username: credentials.username as string } })
    if (!user) return null
    const ok = await compare(credentials.password as string, user.passwordHash)
    return ok ? { id: user.id, role: user.role, name: user.name } : null
  }
})
```

- [ ] **Step 4: Add login UI and middleware redirect rules**

```ts
if (!session && request.nextUrl.pathname.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

- [ ] **Step 5: Write the failing login E2E test**

```ts
test('admin can log in and see admin page link', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('账号').fill('admin')
  await page.getByLabel('密码').fill('admin123456')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByText('管理员功能')).toBeVisible()
})
```

- [ ] **Step 6: Run unit + E2E tests**

Run:
```bash
npm run test -- tests/unit/auth.test.ts && npm run test:e2e -- tests/e2e/login.spec.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/env.ts src/lib/auth.ts src/lib/permissions.ts middleware.ts src/app/api/auth/[...nextauth]/route.ts src/app/(auth)/login/page.tsx src/components/login-form.tsx tests/unit/auth.test.ts tests/e2e/login.spec.ts
git commit -m "feat: add credentials auth and role guards"
```

### Task 4: Build the shared app shell and navigation

**Files:**
- Create: `src/components/app-shell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
import { render, screen } from '@testing-library/react'
import { AppShell } from '@/components/app-shell'

test('shows member and leaderboard navigation entries', () => {
  render(<AppShell role="MEMBER">内容</AppShell>)
  expect(screen.getByText('今日录入')).toBeInTheDocument()
  expect(screen.getByText('日榜')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/app-shell.test.tsx
```
Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement responsive shell**

```tsx
export function AppShell({ role, children }: PropsWithChildren<{ role: 'ADMIN' | 'MEMBER' }>) {
  const links = role === 'ADMIN'
    ? ['今日录入', '日榜', '总榜', '管理员功能']
    : ['今日录入', '日榜', '总榜']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav>{links.map((label) => <span key={label}>{label}</span>)}</nav>
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Redirect `/` to the right landing page**

```tsx
redirect('/entry')
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/app-shell.test.tsx
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/app-shell.tsx src/app/layout.tsx src/app/page.tsx tests/unit/app-shell.test.tsx
git commit -m "feat: add responsive app shell"
```

### Task 5: Implement member daily sales entry

**Files:**
- Create: `src/lib/validators/sales.ts`
- Create: `src/server/services/sales-service.ts`
- Create: `src/components/sales-entry-form.tsx`
- Create: `src/app/(member)/entry/page.tsx`
- Test: `tests/unit/sales-service.test.ts`
- Test: `tests/e2e/member-entry.spec.ts`

- [ ] **Step 1: Write the failing service test**

```ts
import { describe, expect, test } from 'vitest'
import { normalizeSalePayload } from '@/server/services/sales-service'

describe('sales payload', () => {
  test('accepts non-negative integer counts', () => {
    expect(normalizeSalePayload({ count40: 2, count60: 1 })).toEqual({ count40: 2, count60: 1 })
  })
})
```

- [ ] **Step 2: Run unit test to verify it fails**

Run:
```bash
npm run test -- tests/unit/sales-service.test.ts
```
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement schema validation and upsert logic**

```ts
export const salesSchema = z.object({
  saleDate: z.string().min(1),
  count40: z.number().int().min(0),
  count60: z.number().int().min(0),
  remark: z.string().max(200).optional()
})
```

```ts
await db.salesRecord.upsert({
  where: { userId_saleDate: { userId, saleDate } },
  update: payload,
  create: { ...payload, userId, saleDate }
})
```

- [ ] **Step 4: Add mobile-first form page**

```tsx
<form action={saveSalesRecord} className="space-y-4">
  <input name="count40" type="number" min="0" />
  <input name="count60" type="number" min="0" />
  <button type="submit">保存今日记录</button>
</form>
```

- [ ] **Step 5: Write the failing E2E flow**

```ts
test('member can create or update a daily record', async ({ page }) => {
  await page.goto('/entry')
  await page.getByLabel('40 套餐').fill('5')
  await page.getByLabel('60 套餐').fill('2')
  await page.getByRole('button', { name: '保存今日记录' }).click()
  await expect(page.getByText('保存成功')).toBeVisible()
})
```

- [ ] **Step 6: Run tests**

Run:
```bash
npm run test -- tests/unit/sales-service.test.ts && npm run test:e2e -- tests/e2e/member-entry.spec.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validators/sales.ts src/server/services/sales-service.ts src/components/sales-entry-form.tsx src/app/(member)/entry/page.tsx tests/unit/sales-service.test.ts tests/e2e/member-entry.spec.ts
git commit -m "feat: add member daily entry flow"
```

### Task 6: Implement member history page

**Files:**
- Create: `src/components/my-records-table.tsx`
- Create: `src/app/(member)/records/page.tsx`
- Modify: `src/server/services/sales-service.ts`
- Test: `tests/unit/member-records-query.test.ts`

- [ ] **Step 1: Write the failing history query test**

```ts
import { describe, expect, test } from 'vitest'
import { groupRecordsForMember } from '@/server/services/sales-service'

describe('member records query', () => {
  test('sorts records by date descending', () => {
    const result = groupRecordsForMember([
      { saleDate: new Date('2026-07-01') },
      { saleDate: new Date('2026-07-03') }
    ] as never)
    expect(result[0].saleDate.toISOString()).toContain('2026-07-03')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/member-records-query.test.ts
```
Expected: FAIL because helper does not exist.

- [ ] **Step 3: Add query helper and table component**

```ts
export function groupRecordsForMember(records: Array<{ saleDate: Date }>) {
  return [...records].sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())
}
```

- [ ] **Step 4: Render paginated history page**

```tsx
<MyRecordsTable rows={records} emptyText="暂无历史记录" />
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/member-records-query.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/my-records-table.tsx src/app/(member)/records/page.tsx src/server/services/sales-service.ts tests/unit/member-records-query.test.ts
git commit -m "feat: add member record history page"
```

### Task 7: Implement daily and ranged leaderboards

**Files:**
- Create: `src/server/services/leaderboard-service.ts`
- Create: `src/components/leaderboard-table.tsx`
- Create: `src/app/(shared)/leaderboard/daily/page.tsx`
- Create: `src/app/(shared)/leaderboard/range/page.tsx`
- Test: `tests/unit/leaderboard-service.test.ts`

- [ ] **Step 1: Write the failing leaderboard aggregation test**

```ts
import { describe, expect, test } from 'vitest'
import { buildLeaderboard } from '@/server/services/leaderboard-service'

describe('leaderboard aggregation', () => {
  test('ranks by total count descending', () => {
    const board = buildLeaderboard([
      { userName: 'A', count40: 1, count60: 1 },
      { userName: 'B', count40: 3, count60: 0 }
    ])
    expect(board[0].userName).toBe('B')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/leaderboard-service.test.ts
```
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement aggregation helpers**

```ts
export function buildLeaderboard(rows: InputRow[]) {
  return rows
    .map((row) => ({ ...row, total: row.count40 + row.count60 }))
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
```

- [ ] **Step 4: Build date-filtered pages using shared table**

```tsx
<LeaderboardTable rows={rows} title="每日排行榜" />
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/leaderboard-service.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/leaderboard-service.ts src/components/leaderboard-table.tsx src/app/(shared)/leaderboard/daily/page.tsx src/app/(shared)/leaderboard/range/page.tsx tests/unit/leaderboard-service.test.ts
git commit -m "feat: add daily and ranged leaderboards"
```

### Task 8: Implement admin member management

**Files:**
- Create: `src/lib/validators/member.ts`
- Create: `src/components/admin/member-form.tsx`
- Create: `src/components/admin/member-table.tsx`
- Create: `src/app/(admin)/admin/members/page.tsx`
- Test: `tests/unit/member-management.test.ts`

- [ ] **Step 1: Write the failing member validation test**

```ts
import { describe, expect, test } from 'vitest'
import { memberSchema } from '@/lib/validators/member'

describe('member schema', () => {
  test('requires username and display name', () => {
    expect(() => memberSchema.parse({ username: '', name: '' })).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/member-management.test.ts
```
Expected: FAIL because validator does not exist.

- [ ] **Step 3: Implement validator and create/update actions**

```ts
export const memberSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(1),
  password: z.string().min(8),
  status: z.enum(['ACTIVE', 'DISABLED'])
})
```

- [ ] **Step 4: Build admin members page**

```tsx
<MemberTable rows={members} />
<MemberForm submitLabel="新增成员" />
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/member-management.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/member.ts src/components/admin/member-form.tsx src/components/admin/member-table.tsx src/app/(admin)/admin/members/page.tsx tests/unit/member-management.test.ts
git commit -m "feat: add admin member management"
```

### Task 9: Implement admin sales record management

**Files:**
- Create: `src/components/admin/sales-table.tsx`
- Create: `src/app/(admin)/admin/sales/page.tsx`
- Modify: `src/server/services/sales-service.ts`
- Test: `tests/unit/admin-sales-management.test.ts`

- [ ] **Step 1: Write the failing admin sales filter test**

```ts
import { describe, expect, test } from 'vitest'
import { filterSalesRows } from '@/server/services/sales-service'

describe('admin sales filters', () => {
  test('filters by username', () => {
    const rows = filterSalesRows([
      { userName: 'alice' },
      { userName: 'bob' }
    ] as never, { keyword: 'ali' })
    expect(rows).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/admin-sales-management.test.ts
```
Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement filter/edit helpers**

```ts
export function filterSalesRows(rows: Array<{ userName: string }>, query: { keyword?: string }) {
  if (!query.keyword) return rows
  return rows.filter((row) => row.userName.includes(query.keyword))
}
```

- [ ] **Step 4: Build admin sales page with edit form**

```tsx
<SalesTable rows={rows} />
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/admin-sales-management.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/sales-table.tsx src/app/(admin)/admin/sales/page.tsx src/server/services/sales-service.ts tests/unit/admin-sales-management.test.ts
git commit -m "feat: add admin sales management"
```

### Task 10: Implement commission rule management with overlap protection

**Files:**
- Create: `src/lib/validators/commission.ts`
- Create: `src/server/services/commission-service.ts`
- Create: `src/components/admin/commission-rule-form.tsx`
- Create: `src/components/admin/commission-rule-table.tsx`
- Create: `src/app/(admin)/admin/commission-rules/page.tsx`
- Test: `tests/unit/commission-service.test.ts`

- [ ] **Step 1: Write the failing overlap test**

```ts
import { describe, expect, test } from 'vitest'
import { hasOverlappingRules } from '@/server/services/commission-service'

describe('commission overlap detection', () => {
  test('rejects overlapping date ranges for same user', () => {
    expect(hasOverlappingRules([
      { start: new Date('2026-07-01'), end: new Date('2026-07-31') },
      { start: new Date('2026-07-15'), end: new Date('2026-08-15') }
    ])).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/commission-service.test.ts
```
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement validator and overlap detection**

```ts
export function hasOverlappingRules(rules: Array<{ start: Date; end: Date }>) {
  const sorted = [...rules].sort((a, b) => a.start.getTime() - b.start.getTime())
  return sorted.some((rule, index) => index > 0 && rule.start <= sorted[index - 1].end)
}
```

- [ ] **Step 4: Build admin commission rule page**

```tsx
<CommissionRuleForm submitLabel="保存规则" />
<CommissionRuleTable rows={rules} />
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/commission-service.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/commission.ts src/server/services/commission-service.ts src/components/admin/commission-rule-form.tsx src/components/admin/commission-rule-table.tsx src/app/(admin)/admin/commission-rules/page.tsx tests/unit/commission-service.test.ts
git commit -m "feat: add commission rule management"
```

### Task 11: Implement settlement calculation

**Files:**
- Create: `src/lib/validators/settlement.ts`
- Create: `src/server/services/settlement-service.ts`
- Create: `src/components/admin/settlement-table.tsx`
- Create: `src/app/(admin)/admin/settlements/page.tsx`
- Test: `tests/unit/settlement-service.test.ts`
- Test: `tests/e2e/admin-settlement.spec.ts`

- [ ] **Step 1: Write the failing settlement test**

```ts
import { describe, expect, test } from 'vitest'
import { calculateSettlementRow } from '@/server/services/settlement-service'

describe('settlement calculation', () => {
  test('calculates amount from matched commission rule', () => {
    const row = calculateSettlementRow({ count40: 2, count60: 1 }, { price40: 10, price60: 20 })
    expect(row.amount).toBe(40)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/settlement-service.test.ts
```
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement settlement helpers**

```ts
export function calculateSettlementRow(
  sales: { count40: number; count60: number },
  rule: { price40: number; price60: number }
) {
  return { amount: sales.count40 * rule.price40 + sales.count60 * rule.price60 }
}
```

- [ ] **Step 4: Handle missing rule state explicitly**

```ts
if (!rule) {
  return { status: 'MISSING_RULE', amount: null }
}
```

- [ ] **Step 5: Write the failing settlement E2E test**

```ts
test('admin can calculate settlement for a date range', async ({ page }) => {
  await page.goto('/admin/settlements')
  await page.getByLabel('开始日期').fill('2026-07-01')
  await page.getByLabel('结束日期').fill('2026-07-31')
  await page.getByRole('button', { name: '生成结算' }).click()
  await expect(page.getByText('应结金额')).toBeVisible()
})
```

- [ ] **Step 6: Run tests**

Run:
```bash
npm run test -- tests/unit/settlement-service.test.ts && npm run test:e2e -- tests/e2e/admin-settlement.spec.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validators/settlement.ts src/server/services/settlement-service.ts src/components/admin/settlement-table.tsx src/app/(admin)/admin/settlements/page.tsx tests/unit/settlement-service.test.ts tests/e2e/admin-settlement.spec.ts
git commit -m "feat: add settlement calculation"
```

### Task 12: Implement Excel export endpoints

**Files:**
- Create: `src/server/services/export-service.ts`
- Create: `src/app/api/export/daily/route.ts`
- Create: `src/app/api/export/range/route.ts`
- Create: `src/app/api/export/settlement/route.ts`
- Modify: `src/app/(shared)/leaderboard/range/page.tsx`
- Modify: `src/app/(admin)/admin/settlements/page.tsx`
- Test: `tests/unit/export-service.test.ts`

- [ ] **Step 1: Write the failing export unit test**

```ts
import { describe, expect, test } from 'vitest'
import { buildWorkbookBuffer } from '@/server/services/export-service'

describe('excel export', () => {
  test('returns a non-empty xlsx buffer', async () => {
    const buffer = await buildWorkbookBuffer([{ name: 'alice', total: 5 }], '总榜')
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm run test -- tests/unit/export-service.test.ts
```
Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement ExcelJS workbook generation**

```ts
const workbook = new ExcelJS.Workbook()
const sheet = workbook.addWorksheet(sheetName)
sheet.addRows(rows)
return workbook.xlsx.writeBuffer()
```

- [ ] **Step 4: Add export route handlers and UI buttons**

```ts
return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="settlement.xlsx"'
  }
})
```

- [ ] **Step 5: Run tests**

Run:
```bash
npm run test -- tests/unit/export-service.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/export-service.ts src/app/api/export/daily/route.ts src/app/api/export/range/route.ts src/app/api/export/settlement/route.ts src/app/(shared)/leaderboard/range/page.tsx src/app/(admin)/admin/settlements/page.tsx tests/unit/export-service.test.ts
git commit -m "feat: add excel export endpoints"
```

### Task 13: Final deployment readiness and smoke verification

**Files:**
- Modify: `.env.example`
- Create: `README.md`
- Create: `docs/deployment/vercel.md`
- Modify: `package.json`
- Test: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing deployment smoke test**

```ts
test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/entry')
  await expect(page).toHaveURL(/login/)
})
```

- [ ] **Step 2: Run smoke test to verify expected behavior is not yet guaranteed**

Run:
```bash
npm run test:e2e -- tests/e2e/smoke.spec.ts
```
Expected: FAIL or flaky until environment setup is complete.

- [ ] **Step 3: Document environment variables and deploy steps**

```env
DATABASE_URL=
AUTH_SECRET=
NEXTAUTH_URL=
```

- [ ] **Step 4: Run full verification**

Run:
```bash
npm run lint && npm run test && npm run test:e2e
```
Expected: All checks PASS.

- [ ] **Step 5: Deploy to Vercel preview and verify env wiring**

Run:
```bash
vercel
```
Expected: Preview deployment succeeds and app connects to Postgres.

- [ ] **Step 6: Commit**

```bash
git add .env.example README.md docs/deployment/vercel.md package.json tests/e2e/smoke.spec.ts
git commit -m "docs: finalize deployment and verification plan"
```

## 3. Verification Checklist

- [ ] Database schema migrated successfully.
- [ ] Seeded admin account can log in.
- [ ] Member can create and update a daily sales record.
- [ ] Duplicate same-day records do not create duplicate rows.
- [ ] Member history sorts newest first.
- [ ] Daily leaderboard ranks by total sales.
- [ ] Range leaderboard respects date filters.
- [ ] Admin can create, disable, and reset member credentials.
- [ ] Admin can search and edit sales records.
- [ ] Commission rules reject overlapping date ranges.
- [ ] Settlement flags rows with missing rules instead of defaulting to zero.
- [ ] Daily/range/settlement Excel exports download valid `.xlsx` files.
- [ ] Member cannot access `/admin/*` routes.
- [ ] Vercel preview build passes with production env vars.

## 4. Risks to Watch During Execution

1. **Date handling drift** — always normalize `saleDate` to a single timezone policy before uniqueness checks.
2. **Auth/session mismatch** — keep role data in session token and gate again on the server.
3. **Prisma hot-reload duplication** — use a singleton client in development.
4. **Excel memory use** — export only requested date range, not the full dataset.
5. **Vercel env mismatch** — validate env vars at startup and fail fast.

## 5. Out of Scope

- 短信 / 微信登录
- 多团队隔离
- 动态套餐模型
- 审批流
- 自动工资发放
- 图表大屏
- 多级管理员权限

## 6. Execution Notes

- 优先按任务顺序执行，不要并行修改同一文件。
- 每个任务完成后先跑对应测试，再做下一任务。
- 若某任务发现设计缺口，先回到 spec 更新，而不是在实现中临时扩展范围。
- 若 Vercel / Neon / Auth.js 的最新接入方式与计划略有出入，以官方文档为准，但必须保持本计划的业务边界不变。
