# Handoff

## 当前目标

- 在新分支中完成第一轮体验增强：
  - `/entry` 保存确认卡
  - 成员端 `/leaderboard/range` 累计买卡排行
  - 管理员首页累计买卡趋势面板
- 完成后再进入完整验证与后续上线准备。

## 今天已完成内容

- 已建立隔离 worktree：
  - `/home/chia/Code/maika/.worktrees/entry-feedback-cumulative-stats`
  - 分支：`feat/entry-feedback-cumulative-stats`
- `/entry` 体验增强已实现：
  - `saveSalesEntryAction` 现在返回结构化 `summary`
  - `saveSalesRecordForUser` 现在返回 `isUpdate + record`
  - 新增 `SalesEntrySuccessCard`
  - 新增 `SalesEntryPageClient`
  - 表单改为由页面层驱动 action state
- 成员端累计统计已实现：
  - 新增 `cumulative-sales-stats-service.ts`
  - `/leaderboard/range` 默认区间改为“本月”
  - 已接入累计买卡排行块
- 管理员端累计统计已实现：
  - 新增 `CumulativeTrendChart`
  - 新增 `AdminCumulativeStatsPanel`
  - `/admin` 已接入 `preset / metric` URL 驱动筛选
- 已通过的阶段性验证：
  - `tests/unit/sales-entry-action.test.ts`
  - `tests/unit/sales-entry-success-card.test.tsx`
  - `tests/e2e/member-entry.spec.ts`
  - `tests/unit/cumulative-sales-stats-service.test.ts`
  - `tests/unit/leaderboard-cache.test.ts`
  - `tests/unit/cumulative-ranking-chart.test.tsx`
  - `tests/e2e/cumulative-stats.spec.ts --grep member`
  - `tests/unit/cumulative-trend-chart.test.tsx`
  - `tests/e2e/cumulative-stats.spec.ts --grep admin`

## 当前进行中的内容

- 正在执行该分支的总验证与收尾。
- 尚未跑完整 `lint / tsc / test / test:e2e / build` 全套安全网。

## 剩余工作

- 跑目标验证集：
  - 新增 unit tests
  - `member-entry.spec.ts`
  - `cumulative-stats.spec.ts`
- 跑完整安全网：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
  - `npm run test:e2e`
  - `npm run build`
- 根据验证结果修复剩余问题。
- 如果验证全部通过，再决定是否整理分支、提交、合并或部署。

## 关键决策和约束

- 技术栈固定：Next.js App Router + TypeScript + Prisma + PostgreSQL + Auth.js Credentials。
- 角色固定：`MEMBER` / `ADMIN`。
- 套餐固定：`40` / `60`。
- 每人每天仅一条销售记录，`userId + saleDate` 唯一。
- 本轮 `/entry` 成功卡展示的是：
  - 销售日期
  - `40` 套餐数量
  - `60` 套餐数量
  - 总数
  - 备注摘要
  - 保存时间
  不是“销售额”，因为当前数据模型没有该字段。
- `/entry` 的“是否覆盖”由后端保存动作直接返回 `isUpdate`，前端不预查。
- 累计统计口径是数量求和：
  - `TOTAL = sum(count40) + sum(count60)`
  - `PLAN_40 = sum(count40)`
  - `PLAN_60 = sum(count60)`
- 累计统计对象当前限定为：`role === MEMBER && status === ACTIVE`
- 成员端累计模块挂在 `/leaderboard/range`，默认使用“本月”区间
- 管理员端累计模块挂在 `/admin`，支持 `MONTH / ROLLING_30 / ALL_TIME`
- 榜单缓存 TTL 为 `30` 秒。
- 累计统计与榜单共用 `LEADERBOARD_CACHE_TAG`，并额外对 `/admin` 做 revalidate。

## 重要文件路径

- 交接文档：[docs/ai/handoff.md](/home/chia/Code/maika/docs/ai/handoff.md)
- 录入 action：[actions.ts](/home/chia/Code/maika/src/app/(member)/entry/actions.ts)
- 录入 form state：[form-state.ts](/home/chia/Code/maika/src/app/(member)/entry/form-state.ts)
- 录入页服务端入口：[page.tsx](/home/chia/Code/maika/src/app/(member)/entry/page.tsx)
- 录入页客户端壳层：[sales-entry-page-client.tsx](/home/chia/Code/maika/src/components/sales-entry-page-client.tsx)
- 录入成功卡：[sales-entry-success-card.tsx](/home/chia/Code/maika/src/components/sales-entry-success-card.tsx)
- 累计统计服务：[cumulative-sales-stats-service.ts](/home/chia/Code/maika/src/server/services/cumulative-sales-stats-service.ts)
- 榜单缓存：[leaderboard-cache.ts](/home/chia/Code/maika/src/server/services/leaderboard-cache.ts)
- 成员端累计排行图：[cumulative-ranking-chart.tsx](/home/chia/Code/maika/src/components/cumulative-ranking-chart.tsx)
- 管理员趋势图：[cumulative-trend-chart.tsx](/home/chia/Code/maika/src/components/cumulative-trend-chart.tsx)
- 管理员累计面板：[admin-cumulative-stats-panel.tsx](/home/chia/Code/maika/src/components/admin/admin-cumulative-stats-panel.tsx)
- 总榜页：[page.tsx](/home/chia/Code/maika/src/app/(shared)/leaderboard/range/page.tsx)
- 管理员首页：[page.tsx](/home/chia/Code/maika/src/app/(admin)/admin/page.tsx)

## 当前阻塞和风险

- Playwright 启动时仍会出现 Next.js workspace root warning：
  - `/home/chia/package-lock.json`
  - `/home/chia/Code/maika/package-lock.json`
- Admin E2E 曾出现一次 Neon 数据库瞬时连接失败，重试后通过；说明外部数据库可用性仍是测试波动源。
- 成员端累计模块标题当前固定为 `本月累计买卡`，如果后续需要更严谨展示用户自定义区间，可能要再改文案或动态标题。
- Next.js 仍有 workspace root warning：
  - `/home/chia/package-lock.json`
  - `/home/chia/Code/maika/package-lock.json`

## 下次启动后优先执行的 3 个步骤

1. 进入 worktree：`/home/chia/Code/maika/.worktrees/entry-feedback-cumulative-stats`
2. 先跑完整验证：
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test`
   - `npm run test:e2e`
   - `npm run build`
3. 若全绿，再决定：
   - 是否提交当前功能分支
   - 是否合并回主工作区
   - 是否进入上线前人工 QA

## 当前验证状态

- 已通过：
  - worktree baseline `npm run test`
  - `tests/unit/sales-entry-action.test.ts`
  - `tests/unit/sales-entry-success-card.test.tsx`
  - `tests/unit/cumulative-sales-stats-service.test.ts`
  - `tests/unit/leaderboard-cache.test.ts`
  - `tests/unit/cumulative-ranking-chart.test.tsx`
  - `tests/unit/cumulative-trend-chart.test.tsx`
  - `tests/unit/leaderboard-actions-revalidation.test.ts`
  - `tests/e2e/member-entry.spec.ts`
  - `tests/e2e/cumulative-stats.spec.ts --grep member`
  - `tests/e2e/cumulative-stats.spec.ts --grep admin`
- 当前未验证：
  - `npm run lint`
  - `npx tsc --noEmit`
  - 完整 `npm run test`
  - 完整 `npm run test:e2e`
  - `npm run build`
