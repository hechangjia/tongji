[根目录](../../../CLAUDE.md) > [src](../../) > [app](../) > **api**

# API Routes Module

## 模块职责

只读 API 层，包含 Auth.js handler 与 Excel 导出接口。所有业务写操作仍然走 Server Actions。

## 入口与启动

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/export/daily/route.ts`
- `src/app/api/export/range/route.ts`
- `src/app/api/export/settlement/route.ts`

## 对外接口

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...nextauth]` | `GET` / `POST` | Public | Auth.js v5 handler |
| `/api/export/daily` | `GET` | Admin | 导出日榜 Excel |
| `/api/export/range` | `GET` | Admin | 导出区间榜 Excel |
| `/api/export/settlement` | `GET` | Admin | 导出结算 Excel |

## 关键依赖与配置

- `src/lib/auth.ts`
- `src/lib/permissions.ts`
- `src/server/services/export-service.ts`
- `src/server/services/leaderboard-service.ts`
- `src/server/services/settlement-service.ts`
- `src/server/services/sales-service.ts`

## 数据模型

导出接口主要读取：
- `SalesRecord`
- `IdentifierSale`
- `CommissionRule`
- `User`

认证 handler 主要读取：
- `User`

## 测试与质量

- 单测：`tests/unit/export-service.test.ts`
- E2E：由管理员结算与榜单流程间接覆盖

## 常见问题 (FAQ)

### 为什么导出接口不是 `/admin/*` 页面 Action？
Excel 下载需要明确的二进制 HTTP 响应头，Route Handler 更合适。

### 为什么这里只有 4 个路由？
当前架构刻意避免 API 膨胀，写路径统一沉到 Server Actions。

## 相关文件清单

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/export/daily/route.ts`
- `src/app/api/export/range/route.ts`
- `src/app/api/export/settlement/route.ts`
- `src/server/services/export-service.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Revalidated route inventory and kept API scope limited to auth handler plus read-only export endpoints. |
