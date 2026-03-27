# Handoff

## 当前目标

- 当前功能已完成并已推送到 `origin/feat/daily-rhythm-top3`。
- 下次会话的主目标不是继续实现功能，而是决定后续交付动作：
  - 开 PR / 合并 / 部署
  - 是否补 Prisma baseline / migration metadata

## 今天已完成内容

- 完成 `每日节奏 + 审核状态 + 前三单激励` 第一版闭环。
- 成员端 `/entry`：
  - 展示今日节奏摘要
  - 保存后重置为 `PENDING`
  - 被驳回时展示管理员驳回原因
- 管理端 `/admin`：
  - 展示今日审核摘要
- 管理端 `/admin/sales`：
  - 默认打开今日审核队列
  - 恢复历史日期筛选，支持跨日继续审核
  - 审核动作已修复为稳定提交 `APPROVED / REJECTED`
- 日榜 `/leaderboard/daily`：
  - 展示临时前三 / 正式前三
- 数据层：
  - `SalesRecord` 新增 `lastSubmittedAt`、`reviewStatus`、`reviewedAt`、`reviewNote`
  - migration / backfill 会把历史记录回填为 `APPROVED`
- 外部 Neon 数据库已手动执行本次 migration SQL，并确认 backfill 无待补数据。
- 已提交并推送：
  - 分支：`feat/daily-rhythm-top3`
  - commit：`b8b5e3d`
  - PR 创建入口：`https://github.com/hechangjia/tongji/pull/new/feat/daily-rhythm-top3`

## 当前进行中的内容

- 无代码实现进行中。
- 当前状态是：
  - worktree 干净
  - 分支已推送
  - 验证已完成
  - 等待下一步交付决策

## 剩余工作

- 创建 PR，补充说明并准备合并。
- 若要继续规范 Prisma 迁移链路，为当前 Neon 库补 baseline / resolve 策略。
- 若要部署，按现有分支结果继续走发布流程。

## 关键决策和约束

- 业务日口径固定：`Asia/Shanghai`。
- “今天”由 `saleDate` 定义，不按浏览器时区或 `lastSubmittedAt` 推断。
- 每人每天仅一条销售记录，`userId + saleDate` 唯一。
- 临时前三：`PENDING | APPROVED`。
- 正式前三：`APPROVED`。
- `REJECTED` 不进入临时前三。
- 排序固定：`lastSubmittedAt ASC, id ASC`。
- 本轮不实现：
  - 截图上传
  - 文件存储
  - 独立收单模块
  - 激励金额结算
- 本轮对外部 Neon 的 schema 对齐是手动执行 SQL，不是通过完整 Prisma baseline 完成。

## 重要文件路径

- 交接文档：[docs/ai/handoff.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/ai/handoff.md)
- Prisma schema：[schema.prisma](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/schema.prisma)
- Migration：[migration.sql](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/migrations/20260327104000_add_sales_review_audit_fields/migration.sql)
- 回填脚本：[backfill-last-submitted-at.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/scripts/backfill-last-submitted-at.ts)
- 成员节奏摘要：[entry-daily-rhythm-summary.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/entry-daily-rhythm-summary.tsx)
- 管理员销售页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/sales/page.tsx)
- 管理员销售动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/sales/actions.ts)
- 管理员销售表：[sales-table.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/admin/sales-table.tsx)
- 日榜结果条：[daily-top3-strip.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/components/daily-top3-strip.tsx)
- 统一节奏服务：[daily-rhythm-service.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/daily-rhythm-service.ts)

## 当前阻塞和风险

- 无功能阻塞。
- 主要风险不是代码，而是迁移元数据：
  - 该 Neon 库原先没有 Prisma baseline
  - 本轮为了快速解锁测试，使用了手动 `db execute`
  - 未来若直接对同一数据库跑 `prisma migrate deploy`，仍可能遇到 `P3005`
- `next build` / `playwright` 仍会打印多 `package-lock.json` 的 workspace root warning，但不影响当前功能验证。

## 下次启动后优先执行的 3 个步骤

1. 进入 worktree：`/home/chia/Code/maika/.worktrees/daily-rhythm-top3`
2. 确认分支状态：`git status && git log -1 --oneline`
3. 决定继续动作：
   - 开 PR / 合并 / 部署
   - 或先处理 Prisma baseline / resolve

## 当前验证状态

- 已通过：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
    - `36` 个测试文件
    - `86` 个测试全部通过
  - `npm run build`
  - `npm run test:e2e`
    - `8` 个 E2E 全部通过
- 数据库状态：
  - schema 已与当前代码对齐
  - `scripts/backfill-last-submitted-at.ts` 结果：`pending before: 0`
