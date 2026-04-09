[根目录](../CLAUDE.md) > **prisma**

# Database Layer (Prisma)

## 模块职责

维护 PostgreSQL schema、迁移与 seed 数据，是全项目的数据契约基础。

## 入口与启动

- Schema：`prisma/schema.prisma`
- Seed：`prisma/seed.ts`
- 迁移目录：`prisma/migrations/`

## 对外接口

- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npx tsx prisma/seed.ts`

## 关键依赖与配置

- Provider：`postgresql`
- Generator：`prisma-client-js`
- 环境变量：`DATABASE_URL`

当前枚举覆盖：
- `Role`
- `UserStatus`
- `ContentStatus`
- `BannerSourceType`
- `BannerDisplayMode`
- `SalesReviewStatus`
- `ReminderStatus`
- `ReminderTemplate`
- `IdentifierCodeStatus`
- `ProspectLeadStatus`
- `ProspectLeadSourceType`
- `PlanType`
- `GroupFollowUpSourceType`
- `GroupFollowUpStatus`
- `GroupResourceAuditResourceType`
- `GroupResourceAuditActionType`

## 数据模型

当前共 15 个模型：
- `User`
- `Group`
- `SalesRecord`
- `CommissionRule`
- `DailyTarget`
- `MemberReminder`
- `BannerQuote`
- `BannerSettings`
- `Announcement`
- `IdentifierImportBatch`
- `IdentifierCode`
- `CodeAssignment`
- `ProspectImportBatch`
- `ProspectLead`
- `IdentifierSale`
- `GroupFollowUpItem`
- `GroupResourceAuditLog`

说明：从业务域角度常说“15 个核心模型”，但如果把内容、线索与审计完整展开，实际 schema 中已包含 17 个 `model` 块。本项目旧文档曾沿用早期口径，本轮以 schema 事实为准。

迁移当前为 7 个：
1. `20260327104000_add_sales_review_audit_fields`
2. `20260327190000_add_admin_insights_targets_and_reminders`
3. `20260327213000_add_groups_leaders_and_member_remarks`
4. `20260328101000_add_identifier_codes_and_prospect_leads`
5. `20260328112000_add_member_identifier_sales`
6. `20260329183000_add_leader_workbench_and_group_leaderboard`
7. 初始迁移未保留在当前目录快照说明中，但后续迁移合同由测试补强

## 测试与质量

- `tests/unit/prisma-schema-contract.test.ts`
  - 锁定核心 model / enum
  - 锁定销售审核回填迁移
  - 锁定 leader workbench 迁移合同
- 服务层测试会进一步验证 schema 约束在业务侧的使用方式

## 常见问题 (FAQ)

### 为什么旧根文档写 15 个模型，而 schema 看起来更多？
旧文档使用的是“核心领域模型”口径；当前 schema 实际更丰富，本模块文档以源码为准。

### 为什么迁移数以前写 6，现在是 7？
仓库现在已有 `add_leader_workbench_and_group_leaderboard`，需要同步修正。

### 哪些索引最关键？
`SalesRecord` 的日期与审核索引、`IdentifierCode` 的分组状态索引、`GroupFollowUpItem` 的活动跟进索引、`GroupResourceAuditLog` 的时间索引。

## 相关文件清单

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/20260327104000_add_sales_review_audit_fields/migration.sql`
- `prisma/migrations/20260329183000_add_leader_workbench_and_group_leaderboard/migration.sql`
- `tests/unit/prisma-schema-contract.test.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Corrected migration count, clarified model-count terminology mismatch, and linked schema-contract coverage. |
