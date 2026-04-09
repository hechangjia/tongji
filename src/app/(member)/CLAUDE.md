[根目录](../../../CLAUDE.md) > [src](../../) > [app](../) > **(member)**

# Member Pages Module

## 模块职责

成员模块提供每日录单、识别码成交录入、个人历史记录与洞察信息展示。`MEMBER` 与 `ADMIN` 可进入成员区域。

## 入口与启动

- 布局：`src/app/(member)/layout.tsx`
- 页面：
  - `src/app/(member)/entry/page.tsx`
  - `src/app/(member)/records/page.tsx`
- `entry/page.tsx` 并发读取：
  - 当日销售记录
  - 成员日节奏摘要
  - 成员目标反馈 / 自我趋势 / 最近提醒
  - 识别码工作区数据

## 对外接口

位于 `src/app/(member)/entry/actions.ts`：
- `saveSalesEntryAction`
- `saveIdentifierSaleAction`

动作特征：
- 均校验成员权限
- 成功后刷新：
  - `refreshLeaderboardCaches()`
  - `refreshEntryInsightsCache()`
  - `refreshMemberRecordsCache()`
- 识别码成交额外刷新：`refreshLeaderWorkbenchCaches()`

## 关键依赖与配置

- 权限：`canAccessMemberArea()`
- 服务：
  - `sales-service.ts`
  - `member-identifier-sale-service.ts`
  - `daily-target-service.ts`
  - `daily-rhythm-service.ts`
  - `member-reminder-service.ts`
- 缓存：
  - `entry-insights-cache.ts`
  - `member-records-cache.ts`
  - `leaderboard-cache.ts`
- 组件：
  - `sales-entry-page-client.tsx`
  - `sales-entry-form.tsx`
  - `member-identifier-sale-form.tsx`
  - `member-identifier-sale-history.tsx`
  - `entry-daily-target-card.tsx`
  - `entry-daily-rhythm-summary.tsx`
  - `entry-self-trend-summary.tsx`
  - `entry-reminder-list.tsx`
  - `my-records-table.tsx`

## 数据模型

- 传统录单：`SalesRecord`
- 识别码成交：`IdentifierSale`
- 线索闭环：`ProspectLead`、`GroupFollowUpItem`
- 洞察：`DailyTarget`、`MemberReminder`

关键约束：
- 同一成员同一天如果已有 `IdentifierSale`，不能继续走传统 `SalesRecord` 录单
- 识别码成交会回写工作台相关数据，并影响共享榜单与组长视图

## 测试与质量

- 单测：
  - `tests/unit/sales-entry-action.test.ts`
  - `tests/unit/member-actions.test.ts`
  - `tests/unit/member-identifier-entry-action.test.ts`
  - `tests/unit/member-identifier-sale-service.test.ts`
  - `tests/unit/member-records-query.test.ts`
  - `tests/unit/entry-page.test.tsx`
  - `tests/unit/records-page.test.tsx`
- E2E：`tests/e2e/member-entry.spec.ts`

## 常见问题 (FAQ)

### 为什么成员页既支持普通录单又支持识别码成交？
系统处于兼容阶段，传统 `SalesRecord` 与新 `IdentifierSale` 并存，但聚合统计会优先使用识别码成交数据。

### 为什么保存一条成员数据会刷新这么多缓存？
成员录单会影响个人洞察、个人记录、共享榜单、管理员统计，识别码成交还会影响组长工作台。

### `/records` 和 `/entry` 的职责如何区分？
`/entry` 负责当天动作与反馈；`/records` 负责历史查询。

## 相关文件清单

- `src/app/(member)/layout.tsx`
- `src/app/(member)/entry/page.tsx`
- `src/app/(member)/entry/actions.ts`
- `src/app/(member)/records/page.tsx`
- `src/server/services/sales-service.ts`
- `src/server/services/member-identifier-sale-service.ts`
- `src/server/services/entry-insights-cache.ts`
- `src/server/services/member-records-cache.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Reconfirmed dual entry flow, cache refresh fan-out, and identifier-sale workspace behavior. |
