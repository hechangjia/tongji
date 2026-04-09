[根目录](../../../../CLAUDE.md) > [src](../../../) > [app](../../) > **(shared)/leaderboard**

# Shared Leaderboard Pages

## 模块职责

共享榜单模块展示所有角色都能访问的排行榜视图，包括日榜、区间榜和小组榜。匿名用户也可访问小组榜的组级视图。

## 入口与启动

- 页面：
  - `daily/page.tsx`
  - `range/page.tsx`
  - `groups/page.tsx`
- `daily/page.tsx` 使用 Next.js 15+ 异步 `searchParams`
- `groups/page.tsx` 根据登录状态决定是否包裹 `AppShell`

## 对外接口

- 无写接口，全部为只读页面
- 页面读取的核心函数：
  - `getCachedDailyLeaderboard()`
  - `getCachedRangeLeaderboard()`
  - `getCachedDailyTop3Status()`
  - `getCachedGroupLeaderboard()`
  - `getVisibleGroupMemberRows()`
  - `getCachedMemberCumulativeRanking()` / `getCachedAdminCumulativeTrend()`

## 关键依赖与配置

- 服务：
  - `leaderboard-service.ts`
  - `group-leaderboard-service.ts`
  - `cumulative-sales-stats-service.ts`
  - `leaderboard-cache.ts`
- 组件：
  - `leaderboard-table.tsx`
  - `daily-top3-strip.tsx`
  - `cumulative-ranking-chart.tsx`
  - `cumulative-trend-chart.tsx`
  - `leader/group-leaderboard-table.tsx`

## 数据模型

榜单来源并不是直接读单一表，而是聚合：
- `IdentifierSale`
- `SalesRecord`
- `Group`
- `User`

可见性规则：
- 匿名：只看小组总榜
- Leader：可展开本组成员明细
- Admin：可展开所有组成员明细

## 测试与质量

- 单测：
  - `tests/unit/leaderboard-service.test.ts`
  - `tests/unit/leaderboard-cache.test.ts`
  - `tests/unit/leaderboard-actions-revalidation.test.ts`
  - `tests/unit/shared-daily-leaderboard-page.test.tsx`
  - `tests/unit/shared-range-leaderboard-page.test.tsx`
  - `tests/unit/leader-pages.test.tsx`（含 groups 页面权限展开）
- E2E：`tests/e2e/cumulative-stats.spec.ts`

## 常见问题 (FAQ)

### 为什么共享榜单页几乎没有 Action？
它是纯展示层，数据更新来自成员、组长、管理员页面的写入与缓存刷新。

### 为什么小组榜支持匿名访问？
当前实现中匿名访问保留组级公开视图，但不会暴露成员级细节，也不会套用登录后的 `AppShell`。

### 为什么日榜使用异步 `searchParams`？
这是 Next.js 15+/16 的接口形式，页面已适配异步参数读取。

## 相关文件清单

- `src/app/(shared)/leaderboard/daily/page.tsx`
- `src/app/(shared)/leaderboard/range/page.tsx`
- `src/app/(shared)/leaderboard/groups/page.tsx`
- `src/server/services/leaderboard-service.ts`
- `src/server/services/group-leaderboard-service.ts`
- `src/server/services/cumulative-sales-stats-service.ts`
- `src/server/services/leaderboard-cache.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Updated group leaderboard visibility rules and anonymous rendering behavior; confirmed async searchParams usage on daily page. |
