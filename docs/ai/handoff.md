# Handoff

## 当前目标

- 完成 `admin insights + daily targets + member reminders` 功能闭环。
- 准备最终提交、推送和后续预览部署。

## 今天已完成内容

- 新增 Prisma 模型与 migration：
  - `DailyTarget`
  - `MemberReminder`
  - `ReminderStatus`
- 完成服务层：
  - 目标建议 / 自动生成 / 调整
  - 成员提醒创建 / 查询
  - 管理端诊断卡片计算
- 完成管理端 `/admin/insights`：
  - 总览指标
  - 风险成员卡片
  - 调整今日目标
  - 发送站内提醒
- 完成成员端 `/entry`：
  - 今日目标卡片
  - 自我趋势卡片
  - 最近提醒列表
  - 保存后刷新目标 / 趋势 / 提醒反馈
- 补了单测与 E2E。
- 修复了一个真实缺口：
  - 无今日目标时现在会自动生成 `DailyTarget`
  - `/admin/insights` 现在会显示动作回跳 notice
- 完成完整验证：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e`（隔离本地 PostgreSQL）

## 当前进行中的内容

- 无实现中的代码块。
- 当前只剩提交、推送 / 部署动作。

## 剩余工作

1. 提交最终 ship commit。
2. `git push`。
3. 部署前同步目标数据库 schema。

## 关键决策和约束

- 业务日期口径固定为 `Asia/Shanghai`。
- `/admin/sales` 继续只做审核与记录处理，不塞诊断功能。
- `/admin/insights` 负责：
  - 今日诊断
  - 目标调整
  - 站内提醒
- `/entry` 不拆新页面，直接展示目标 / 趋势 / 提醒反馈。
- 今日目标缺失时自动生成并立即生效，管理员可后续调整。
- 成员对比优先看：
  - 自己的今日目标
  - 自己近 7 天常态
- 本期提醒只做站内提醒，不做截图上传 / 文件存储。

## 重要文件路径

- 设计稿：[2026-03-27-admin-insights-targets-reminders-design.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/superpowers/specs/2026-03-27-admin-insights-targets-reminders-design.md)
- 计划稿：[2026-03-27-admin-insights-targets-reminders-plan.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/superpowers/plans/2026-03-27-admin-insights-targets-reminders-plan.md)
- Prisma schema：[schema.prisma](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/schema.prisma)
- 新 migration：[migration.sql](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/prisma/migrations/20260327190000_add_admin_insights_targets_and_reminders/migration.sql)
- 管理端页面：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/insights/page.tsx)
- 管理端动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/insights/actions.ts)
- 成员录入页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(member)/entry/page.tsx)
- 成员保存动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(member)/entry/actions.ts)
- 目标服务：[daily-target-service.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/daily-target-service.ts)
- 提醒服务：[member-reminder-service.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/member-reminder-service.ts)
- 诊断服务：[admin-insights-service.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/server/services/admin-insights-service.ts)
- 新 E2E：[admin-insights.spec.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/tests/e2e/admin-insights.spec.ts)

## 当前阻塞和风险

- 代码主线无阻塞。
- 共享 Neon 开发库当前缺少 `daily_targets` / `member_reminders` 表时，`/entry` 和 `/admin/insights` 会直接报错。
- 因此：
  - 本轮 E2E 是在临时本地 PostgreSQL 容器里完成的
  - 真正部署前必须先同步目标数据库 schema
- 仍有 workspace root warning，但不阻塞构建与测试。

## 下次启动后优先执行的 3 个步骤

1. 进入 worktree 并确认状态：`git status && git log --oneline -5`
2. 如果尚未 push，先把最终 commit 推到远端
3. 部署前先同步目标数据库 schema，再做 Preview / Production 验证

## 当前验证状态

- 已通过：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
    - `43` 个测试文件
    - `101` 个测试通过
  - `npm run build`
  - `npm run test:e2e`
    - `9` 个 E2E 通过
    - 使用隔离本地 PostgreSQL：`postgresql://postgres:postgres@127.0.0.1:55432/maika?schema=public`
