[根目录](../../../../CLAUDE.md) > [src](../../../) > [app](../../) > **(admin)/admin**

# Admin Pages Module

## 模块职责

管理员主控台，负责成员、销售审核、识别码与线索、经营诊断、卡酬规则、结算、公告与横幅管理。仅 `ADMIN` 可直接访问。

## 入口与启动

- 布局：`src/app/(admin)/admin/layout.tsx`
- 首页：`src/app/(admin)/admin/page.tsx`
- 首页并发读取：
  - `getCachedAdminCumulativeTrend()`
  - `getCachedAdminDailyRhythmSummary()`
- 导航入口覆盖：成员、小组、识别码、销售、卡酬、结算、公告、横幅、经营诊断

## 对外接口

页面与 Action 概览：

| Page | Path | Key Actions |
|------|------|-------------|
| Dashboard | `/admin` | 只读 |
| Members | `/admin/members` | create/update member |
| Groups | `/admin/groups` | create/update group |
| Codes | `/admin/codes` | import codes, import prospects, assign codes, assign prospects |
| Sales | `/admin/sales` | update sales record, approve/reject review |
| Commission Rules | `/admin/commission-rules` | create rule |
| Settlements | `/admin/settlements` | 只读，配合导出 API |
| Insights | `/admin/insights` | adjust target, send reminder |
| Announcements | `/admin/announcements` | create/toggle/pin |
| Banners | `/admin/banners` | create/update settings/import |

高信号动作文件：
- `src/app/(admin)/admin/sales/actions.ts`
- `src/app/(admin)/admin/codes/actions.ts`
- `src/app/(admin)/admin/insights/actions.ts`
- `src/app/(admin)/admin/members/actions.ts`
- `src/app/(admin)/admin/groups/actions.ts`
- `src/app/(admin)/admin/announcements/actions.ts`
- `src/app/(admin)/admin/banners/actions.ts`
- `src/app/(admin)/admin/commission-rules/actions.ts`

## 关键依赖与配置

- 权限：`src/lib/permissions.ts` 中 `canAccessAdmin()`
- 布局鉴权：`src/app/(admin)/admin/layout.tsx`
- 入口保护：`src/proxy.ts`
- 服务层：
  - `admin-insights-service.ts`
  - `admin-code-service.ts`
  - `sales-service.ts`
  - `settlement-service.ts`
  - `commission-service.ts`
  - `group-service.ts`
  - `member-service.ts`
  - `banner-service.ts`
  - `announcement-service.ts`
- 缓存与刷新：`leaderboard-cache.ts`、`entry-insights-cache.ts`、`member-records-cache.ts`

## 数据模型

Admin 侧主要覆盖以下 Prisma 模型：
- `User`
- `Group`
- `SalesRecord`
- `CommissionRule`
- `DailyTarget`
- `MemberReminder`
- `Announcement`
- `BannerQuote`
- `BannerSettings`
- `IdentifierCode`
- `ProspectLead`
- `CodeAssignment`
- `IdentifierImportBatch`
- `ProspectImportBatch`

典型数据动作：
- 销售审核写入 `reviewStatus`、`reviewedAt`、`reviewNote`
- 识别码分发写入 `currentOwnerUserId`、`assignedGroupId`、`assignedAt`
- 线索分配同步建立或重置 `GroupFollowUpItem`

## 测试与质量

- 单测：
  - `tests/unit/admin-insights-actions.test.ts`
  - `tests/unit/admin-insights-service.test.ts`
  - `tests/unit/admin-sales-page.test.tsx`
  - `tests/unit/admin-sales-review-actions.test.ts`
  - `tests/unit/admin-code-service.test.ts`
  - `tests/unit/admin-codes-actions.test.ts`
  - `tests/unit/admin-codes-page.test.tsx`
  - `tests/unit/admin-groups-page.test.tsx`
- E2E：
  - `tests/e2e/admin-insights.spec.ts`
  - `tests/e2e/admin-settlement.spec.ts`
  - `tests/e2e/content-publishing.spec.ts`
- 质量工具：根级 `eslint.config.mjs`、`vitest.config.ts`、`playwright.config.ts`

## 常见问题 (FAQ)

### 为什么 Admin 变更后会同时刷新多个页面？
因为销售、榜单、成员洞察、组长工作台共享部分聚合数据，Action 内会联动 `revalidatePath()` 与缓存 tag 更新。

### 为什么导出不走 Server Actions？
导出是二进制 Excel 响应，统一走 `src/app/api/export/*/route.ts`。

### 为什么 `/admin/codes` 同时涉及线索和跟进项？
线索分配会创建或重置 `GroupFollowUpItem`，这是组长工作台的上游数据源。

## 相关文件清单

- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/sales/actions.ts`
- `src/app/(admin)/admin/codes/actions.ts`
- `src/server/services/admin-code-service.ts`
- `src/server/services/admin-insights-service.ts`
- `src/server/services/sales-service.ts`
- `src/server/services/leaderboard-cache.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Rescanned admin module; confirmed dashboard concurrency, sales review refresh paths, code/prospect assignment behavior, and module file counts. |
