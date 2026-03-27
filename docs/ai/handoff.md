# Handoff

## 当前目标

- 在隔离分支中完成 `每日节奏 + 审核状态 + 前三单激励` 第一版实现。
- 交付范围包括：
  - 成员端 `/entry` 的今日节奏摘要
  - 管理员端 `/admin` 的今日审核摘要
  - 管理员端 `/admin/sales` 的审核流与按状态/时间排序
  - 日榜 `/leaderboard/daily` 的临时前三 / 正式前三结果条
  - `SalesRecord` 上的审核与提交时序字段、回填脚本、缓存联动

## 今天已完成内容

- 已建立新的隔离 worktree：
  - `/home/chia/Code/maika/.worktrees/daily-rhythm-top3`
  - 分支：`feat/daily-rhythm-top3`
- 已完成数据库与契约层改造：
  - `SalesRecord` 新增：
    - `lastSubmittedAt`
    - `reviewStatus`
    - `reviewedAt`
    - `reviewNote`
  - 新增 `SalesReviewStatus` 枚举
  - 新增手写 migration：
    - `prisma/migrations/20260327104000_add_sales_review_audit_fields/migration.sql`
  - 新增历史数据回填脚本：
    - `scripts/backfill-last-submitted-at.ts`
  - 新增 `salesReviewActionSchema`
- 已完成成员保存与审核状态重置链路：
  - 成员每次保存都会重写 `lastSubmittedAt`
  - 成员每次保存都会重置为 `PENDING`
  - 审核通过/驳回动作统一为 `reviewSalesRecordAction`
- 已完成统一服务层与缓存层：
  - 新增 `daily-rhythm-service.ts`
  - 统一计算：
    - 成员今日摘要
    - 管理员今日摘要
    - 临时前三 / 正式前三
    - 管理员今日审核队列
  - `leaderboard-cache.ts` 新增对应 cached readers
  - `refreshLeaderboardCaches()` 现已覆盖：
    - `/entry`
    - `/leaderboard/daily`
    - `/leaderboard/range`
    - `/admin`
    - `/admin/sales`
- 已完成成员端 `/entry`：
  - 新增 `EntryDailyRhythmSummary`
  - `/entry/page.tsx` 服务端并行读取今日记录与成员摘要
  - `SalesEntryPageClient` 现在会显示今日节奏摘要
  - 提交后同 session 内可看到更新后的今日摘要
  - 时间显示已按 `Asia/Shanghai` 且精确到秒
- 已完成管理员端：
  - 新增 `AdminDailyReviewSummary`
  - `/admin` 首页已在累计趋势面板上方展示今日审核摘要
  - `/admin/sales` 已切到 `scope=today` 审核队列模式
  - 队列排序规则：
    - `PENDING`
    - `APPROVED`
    - `REJECTED`
    - 组内按 `lastSubmittedAt ASC, id ASC`
  - 每条记录显示：
    - 最后提交时间
    - 审核状态
    - 临时前三 / 正式前三标识
    - 驳回备注输入框
    - `通过` / `驳回` 按钮
- 已完成日榜：
  - 新增 `DailyTop3Strip`
  - `/leaderboard/daily` 已并行读取榜单和 top3 status
  - 已展示：
    - 临时前三
    - 正式前三
    - 两侧明确空态

## 当前进行中的内容

- 代码实现已完成，当前不再有功能开发中的未提交改动。
- 当前处于：
  - 最终验证已完成大部分
  - 等待数据库 schema 与运行环境对齐后重新跑 Playwright

## 剩余工作

- 在安全前提下对运行环境数据库执行 schema 对齐：
  - 应用新增列 migration
  - 执行 `scripts/backfill-last-submitted-at.ts`
- 对齐后重新跑：
  - `npm run test:e2e`
- 若用户确认可以对外部数据库操作，再决定是否：
  - 在当前环境执行 migration / backfill
  - 推送分支
  - 创建 PR / 合并 / 部署

## 关键决策和约束

- 技术栈固定：Next.js App Router + TypeScript + Prisma + PostgreSQL + Auth.js Credentials。
- 业务规则固定：
  - 角色：`MEMBER / ADMIN`
  - 套餐：`40 / 60`
  - 每人每天仅一条销售记录，`userId + saleDate` 唯一
- 本轮不实现：
  - 截图上传
  - 文件存储
  - 独立收单模块
  - 激励金额结算
- 业务日口径固定：
  - `Asia/Shanghai`
  - `today` 由 `saleDate` 定义
  - 不允许按 `lastSubmittedAt` 或浏览器时区推断“今天”
- 前三规则固定：
  - 临时前三：`PENDING | APPROVED`
  - 正式前三：`APPROVED`
  - `REJECTED` 不进入临时前三
  - 排序：`lastSubmittedAt ASC, id ASC`
- 管理员摘要固定：
  - 一个主动作
  - 两个次级动作：
    - `查看总榜`
    - `管理公告`
- 成员端 / 管理员端 / 日榜页都消费统一服务层，不在页面里重复计算业务规则。
- 真实外部数据库操作仍属于高风险边界：
  - 当前没有自动对外部 Neon 执行 migration
  - 若要执行，需用户确认

## 重要文件路径

- 交接文档：[docs/ai/handoff.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/ai/handoff.md)
- Prisma schema：[schema.prisma](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/schema.prisma)
- Migration：[migration.sql](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/migrations/20260327104000_add_sales_review_audit_fields/migration.sql)
- 回填脚本：[backfill-last-submitted-at.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/scripts/backfill-last-submitted-at.ts)
- 成员录入 action：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(member)/entry/actions.ts)
- 成员录入页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(member)/entry/page.tsx)
- 成员录入客户端壳层：[sales-entry-page-client.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/sales-entry-page-client.tsx)
- 成员节奏摘要组件：[entry-daily-rhythm-summary.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/entry-daily-rhythm-summary.tsx)
- 管理员首页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/page.tsx)
- 管理员摘要组件：[admin-daily-review-summary.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/admin/admin-daily-review-summary.tsx)
- 管理员销售页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/sales/page.tsx)
- 管理员销售表：[sales-table.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/admin/sales-table.tsx)
- 管理员销售 actions：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/sales/actions.ts)
- 日榜页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(shared)/leaderboard/daily/page.tsx)
- 日榜 top3 结果条：[daily-top3-strip.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/daily-top3-strip.tsx)
- 统一节奏服务：[daily-rhythm-service.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/daily-rhythm-service.ts)
- 榜单缓存：[leaderboard-cache.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/leaderboard-cache.ts)

## 当前阻塞和风险

- 完整 Playwright 当前无法通过，核心原因已明确：
  - 当前运行环境数据库缺少列：
    - `sales_records.lastSubmittedAt`
  - 最新完整 `npm run test:e2e` 失败已证明：
    - 多条 E2E 在页面首屏服务端查询阶段直接触发 Prisma `P2022`
- 这不是当前代码工作区未提交改动导致，而是运行环境 schema 落后于代码。
- `next build` 和 `npm run test:e2e` 仍会出现 workspace root warning：
  - `/home/chia/package-lock.json`
  - `/home/chia/Code/maika/package-lock.json`
  - `/home/chia/Code/maika/.worktrees/daily-rhythm-top3/package-lock.json`
- 之前完整 e2e 过程中还出现过一次外部数据库连通性波动；当前最新一轮主因是 schema 缺列。

## 下次启动后优先执行的 3 个步骤

1. 进入 worktree：
   - `/home/chia/Code/maika/.worktrees/daily-rhythm-top3`
2. 先确认是否允许对外部数据库执行 migration / backfill：
   - 若允许，再应用 schema 并执行回填脚本
3. 数据库对齐后立即重跑：
   - `npm run test:e2e`
   - 如通过，再决定 push / PR / 合并

## 当前验证状态

- 已通过：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
    - `35` 个测试文件
    - `83` 个测试全部通过
  - `npm run build`
  - 任务级目标测试均已通过：
    - `tests/unit/prisma-schema-contract.test.ts`
    - `tests/unit/sales-entry-action.test.ts`
    - `tests/unit/admin-sales-review-actions.test.ts`
    - `tests/unit/daily-rhythm-service.test.ts`
    - `tests/unit/entry-daily-rhythm-summary.test.tsx`
    - `tests/unit/admin-daily-review-summary.test.tsx`
    - `tests/unit/admin-sales-management.test.ts`
    - `tests/unit/daily-top3-strip.test.tsx`
    - `tests/unit/leaderboard-cache.test.ts`
    - `tests/unit/sales-entry-page-client.test.ts`
- 当前未通过：
  - `npm run test:e2e`
- `npm run test:e2e` 的最新实际结果：
  - `1` 个通过
  - `7` 个失败
  - 主因均指向运行环境数据库 schema 未包含 `lastSubmittedAt`
  - 典型 Prisma 错误：
    - `P2022`
    - `The column sales_records.lastSubmittedAt does not exist in the current database.`
