[根目录](../../CLAUDE.md) > [src](../) > **components**

# UI Components Module

## 模块职责

集中存放所有 React 组件，分为 Admin、Leader、共享组件与少量通用 UI 组件。页面层负责取数，组件层负责呈现与交互。

## 入口与启动

无单一入口文件；按页面场景直接导入组件。

目录结构：
- `src/components/admin/`
- `src/components/leader/`
- `src/components/ui/`
- `src/components/*`（共享组件）

## 对外接口

高频组件簇：
- Shell：`app-shell`、`app-shell-client`、`app-monitoring`
- Entry：`sales-entry-page-client`、`sales-entry-form`、`member-identifier-sale-form`
- Shared leaderboard：`leaderboard-table`、`daily-top3-strip`、`cumulative-ranking-chart`、`cumulative-trend-chart`
- Leader：`leader-member-ranking-panel`、`leader-group-ranking-panel`、`leader-follow-up-section`、`leader-code-assignment-section`、`leader-audit-timeline`
- Admin：表格、表单、统计卡片、导入卡片

## 关键依赖与配置

- 组件默认遵循 RSC 边界；只有需要浏览器交互时才加 `'use client'`
- 主题相关：`theme-script.tsx`、`theme-palette.tsx`
- Vercel 监控：`app-monitoring.tsx`
- Leader 小组榜复用：`leader/group-leaderboard-table.tsx`

## 数据模型

组件层不直接操作 Prisma 模型，主要消费 DTO：
- 榜单行 DTO
- 组长工作台快照 DTO
- Admin Insights / Sales Review DTO
- Member Entry Insights DTO

## 测试与质量

代表性单测：
- `tests/unit/app-shell.test.tsx`
- `tests/unit/leaderboard-table.test.tsx`
- `tests/unit/daily-top3-strip.test.tsx`
- `tests/unit/cumulative-ranking-chart.test.tsx`
- `tests/unit/cumulative-trend-chart.test.tsx`
- `tests/unit/entry-daily-rhythm-summary.test.tsx`
- `tests/unit/admin-daily-review-summary.test.tsx`
- `tests/unit/admin-import-cards.test.tsx`

## 常见问题 (FAQ)

### 为什么很多组件没有自己请求数据？
本项目遵循“页面/服务层取数，组件层展示”的边界，减少客户端数据耦合。

### 哪些组件最需要注意 RSC 边界？
登录表单、主题选择、图表、动画表格、使用 `useActionState` 的表单组件。

### 为什么 `src/components/leaderboard-table.tsx.orig` 没写进文档？
它是临时副本，不属于正式组件清单。

## 相关文件清单

- `src/components/app-shell.tsx`
- `src/components/sales-entry-page-client.tsx`
- `src/components/leaderboard-table.tsx`
- `src/components/leader/group-leaderboard-table.tsx`
- `src/components/admin/admin-cumulative-stats-panel.tsx`
- `src/components/leader/leader-follow-up-section.tsx`
- `src/components/theme-script.tsx`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Refreshed component inventory, leader workbench panels, and skipped temporary `.orig` artifact from module scope. |
