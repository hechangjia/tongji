[根目录](../../../CLAUDE.md) > [src](../../) > [server](../) > **services**

# Service Layer

## 模块职责

业务逻辑中心层。页面、Server Actions、Route Handlers 都应通过这里访问领域逻辑，而不是直接操作 Prisma。

## 入口与启动

无单一入口；按领域拆分模块。当前共 25 个服务文件。

主要领域：
- 销售与结算
- 榜单与统计
- 组长工作台
- 内容管理
- 成员与小组管理
- 缓存层

## 对外接口

代表性服务：

### 销售与结算
- `sales-service.ts`
- `sales-reporting-service.ts`
- `member-identifier-sale-service.ts`
- `settlement-service.ts`
- `commission-service.ts`

### 榜单与统计
- `leaderboard-service.ts`
- `group-leaderboard-service.ts`
- `cumulative-sales-stats-service.ts`
- `daily-rhythm-service.ts`
- `daily-target-service.ts`

### 组长工作台
- `leader-workbench-service.ts`
- `group-service.ts`

### 内容与系统
- `announcement-service.ts`
- `banner-service.ts`
- `hitokoto-service.ts`
- `export-service.ts`
- `default-user-seed.ts`

### 缓存
- `leaderboard-cache.ts`
- `entry-insights-cache.ts`
- `member-records-cache.ts`
- `shell-content-cache.ts`

## 关键依赖与配置

- 数据源：`@/lib/db`
- 校验源：`@/lib/validators/*`
- 缓存 API：`unstable_cache`、`updateTag`、`revalidatePath`

本轮确认的高信号实现：
- `leaderboard-cache.ts` 使用延迟初始化避免循环依赖
- `sales-service.ts` 在事务内防止普通录单与识别码成交同日冲突
- `leader-workbench-service.ts` 为组资源改派与状态变化记录审计快照
- `admin-code-service.ts` 解析 `csv` / `xlsx`，并在事务内防止 TOCTOU 分配竞争

## 数据模型

服务层几乎覆盖全部 Prisma 模型，重点模型：
- `User`
- `Group`
- `SalesRecord`
- `IdentifierCode`
- `ProspectLead`
- `IdentifierSale`
- `GroupFollowUpItem`
- `GroupResourceAuditLog`
- `CommissionRule`
- `DailyTarget`
- `MemberReminder`

## 测试与质量

覆盖信号：
- 72 个左右 unit test 文件中，大部分直接或间接覆盖服务层
- `prisma-schema-contract.test.ts` 约束模型与迁移合同
- `leader-workbench.spec.ts` 串联验证服务层跨模块联动

## 常见问题 (FAQ)

### 为什么说 Service 层是单一事实来源？
因为销售、榜单、线索、组长工作台都共享聚合与约束，散落到 Action 会导致重复与不一致。

### 为什么缓存逻辑也放在服务层？
本项目把缓存视为领域读取的一部分，而不是页面装饰层。

### 哪些服务最值得下一轮深扫？
`group-leaderboard-service.ts`、`member-identifier-sale-service.ts`、`daily-rhythm-service.ts`。

## 相关文件清单

- `src/server/services/leaderboard-cache.ts`
- `src/server/services/leader-workbench-service.ts`
- `src/server/services/admin-code-service.ts`
- `src/server/services/sales-service.ts`
- `src/server/services/sales-reporting-service.ts`
- `src/server/services/group-leaderboard-service.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Updated service count to 25 and documented transactional guardrails, lazy cache initialization, and workbench audit snapshots. |
