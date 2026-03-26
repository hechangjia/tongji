# Handoff

## 当前目标

- 本地层面的 UI / 内容系统升级已完成。
- 当前下一步是收尾生产可维护性，包括 GitHub 入库准备、默认账号 seed 稳定性和 Vercel 线上监控。

## 今天已完成内容

- 完成 Task 1：初始化 Next.js App Router 工程、Vitest、Playwright、基础构建链路。
- 完成 Task 2：建立 Prisma 数据模型、seed、Prisma client 与环境变量样例。
- 完成 Task 3：Auth.js Credentials 登录、角色权限控制、受保护路由、登录页与登录测试。
- 完成 Task 4：共享壳层导航与根路由跳转。
- 完成 Task 5：成员每日录入、同日 upsert、录入表单和录入 E2E。
- 完成 Task 6：我的记录页和按日期倒序展示。
- 完成 Task 7：日榜 / 总榜服务与页面。
- 完成 Task 8：成员管理页，支持新增成员、改状态、改姓名、重置密码。
- 完成 Task 9：销售记录管理页，支持关键词 / 日期筛选和直接修改记录。
- 完成 Task 10：卡酬规则管理页，支持新增规则并拒绝时间段重叠。
- 完成 Task 11：结算服务与结算页，缺失规则时显式标记 `MISSING_RULE`。
- 完成 Task 12：Excel 导出服务和 3 个导出接口。
- 完成 Task 13 的本地部分：
  - 更新 `.env.example`
  - 撰写 README
  - 撰写 Vercel 部署文档
  - 添加 smoke E2E
  - 跑完本地全量验证
- 完成 2026-03-26 的 UI / 内容系统升级：
  - 重做全站共享壳层，桌面端改为侧栏导航，移动端加入抽屉导航
  - 重做登录页、成员端页面、榜单页和管理员后台视觉
  - 新增后台首页快捷入口卡片
  - 新增横幅一言系统：登录后全站显示，支持随机 / 轮播
  - 新增全体公告系统：登录后全站显示，支持置顶 / 发布时间 / 过期时间
  - 新增管理员内容管理页：`/admin/banners`、`/admin/announcements`
  - 更新 README 和新的 UI / 内容系统 spec、plan
- 完成线上部署收尾：
  - 已完成 Vercel 部署与自定义域名绑定
  - 已接入 Vercel Web Analytics 和 Speed Insights
  - 已修正 seed，不再覆盖已存在的默认管理员 / 示例成员
  - 已补充 `.gitignore`，忽略本地测试产物与 AI 工作流产物

## 当前进行中的内容

- 当前正在做生产可维护性收尾与 GitHub 入库准备。

## 剩余工作

- 将当前代码整理后提交到 GitHub 远程仓库
- 验证生产域名下的 Analytics、Speed Insights 和 Runtime Logs 数据是否开始出现
- 如有需要，继续加“修改用户名 / 个人设置 / 密码重置策略优化”等运维型功能
- 如有需要，处理 workspace root warning

## 关键决策和约束

- 仅做 MVP，不扩展出设计文档之外的功能。
- 技术栈固定：Next.js App Router + TypeScript + Prisma + PostgreSQL + Auth.js Credentials + Vitest + Playwright + ExcelJS。
- 套餐固定为 `40 / 60`。
- 角色固定为 `MEMBER / ADMIN`。
- 每人每天仅一条销售记录，`userId + saleDate` 唯一。
- 卡酬规则按成员 + 生效时间段管理，不允许重叠。
- 结算找不到规则时必须显式标记，不能默认按 `0` 结算。
- 横幅一言与全体公告拆成两个独立系统，不做统一内容中心。
- 横幅一言仅在登录后全站显示，登录页不显示。
- 横幅支持多条内容池与 `RANDOM / ROTATE` 两种模式。
- 公告支持多条、置顶、发布时间、过期时间；已过期公告不显示。
- 为保证当前 Turbopack dev 稳定，最终未采用 `next/font/google` 的中文字体方案，而是改回更稳定的本地字体栈。
- 未经用户明确要求，不自动执行 `git commit`、`git push`、分支操作或真实线上部署。
- 管理员可在 `/admin/members` 修改自己的显示姓名和密码，但当前不能在后台修改登录用户名。
- 默认管理员与示例成员的 seed 行为已改为“仅缺失时创建”，避免重复 seed 覆盖线上账号信息。
- 与工具 / 模型交互使用英文；面向用户输出使用中文。

## 重要文件路径

- 交接文档：[docs/ai/handoff.md](/home/chia/Code/maika/docs/ai/handoff.md)
- 设计文档：[sales-settlement-design.md](/home/chia/Code/maika/docs/superpowers/specs/2026-03-25-sales-settlement-design.md)
- 实现计划：[sales-settlement-plan.md](/home/chia/Code/maika/docs/superpowers/plans/2026-03-25-sales-settlement-plan.md)
- UI / 内容系统设计文档：[maika-ui-content-upgrade-design.md](/home/chia/Code/maika/docs/superpowers/specs/2026-03-26-maika-ui-content-upgrade-design.md)
- UI / 内容系统实现计划：[maika-ui-content-upgrade-plan.md](/home/chia/Code/maika/docs/superpowers/plans/2026-03-26-maika-ui-content-upgrade-plan.md)
- README：[README.md](/home/chia/Code/maika/README.md)
- 部署文档：[vercel.md](/home/chia/Code/maika/docs/deployment/vercel.md)
- Prisma schema：[schema.prisma](/home/chia/Code/maika/prisma/schema.prisma)
- Prisma seed：[seed.ts](/home/chia/Code/maika/prisma/seed.ts)
- 登录配置：[auth.ts](/home/chia/Code/maika/src/lib/auth.ts)
- 共享壳层：[app-shell.tsx](/home/chia/Code/maika/src/components/app-shell.tsx)
- 壳层客户端：[app-shell-client.tsx](/home/chia/Code/maika/src/components/app-shell-client.tsx)
- 横幅服务：[banner-service.ts](/home/chia/Code/maika/src/server/services/banner-service.ts)
- 公告服务：[announcement-service.ts](/home/chia/Code/maika/src/server/services/announcement-service.ts)
- 销售服务：[sales-service.ts](/home/chia/Code/maika/src/server/services/sales-service.ts)
- 榜单服务：[leaderboard-service.ts](/home/chia/Code/maika/src/server/services/leaderboard-service.ts)
- 卡酬规则服务：[commission-service.ts](/home/chia/Code/maika/src/server/services/commission-service.ts)
- 结算服务：[settlement-service.ts](/home/chia/Code/maika/src/server/services/settlement-service.ts)
- 导出服务：[export-service.ts](/home/chia/Code/maika/src/server/services/export-service.ts)

## 当前阻塞和风险

- `vercel` 全局 CLI 未安装，但 `npx vercel --version` 已确认可用，版本 `50.37.1`。
- Preview 部署尚未执行，因此线上环境变量和真实外部数据库接线尚未验证。
- Next.js 仍提示 workspace root warning：`/home/chia/package-lock.json` 与项目内 `package-lock.json` 并存；目前不阻塞。
- 默认 `npm run test:e2e` 会尝试自己拉起 `next dev` 在 `3100` 端口；如果当前目录已有常驻 dev server，Next.js 16 可能拒绝再起第二个实例。
- 仓库仍未产生 git commit，后续若需要基于 diff/worktree 的流程会不稳定。
- 本地 `.env` 与本地 Docker PostgreSQL 仅用于开发验证，不应视为线上环境。
- `npm install` 当前提示依赖树存在 `3 high severity vulnerabilities`，尚未在这轮任务内展开处理。

## 下次启动后优先执行的 3 个步骤

1. 按恢复顺序读取 `~/.claude/CLAUDE.md`、项目 `CLAUDE.md` / `AGENTS.md`、`docs/ai/handoff.md`、spec、plan。
2. 先确认本地最新页面和内容系统功能是否符合预期：`/login`、`/entry`、`/admin`、`/admin/banners`、`/admin/announcements`。
3. 若用户认可，再按 [vercel.md](/home/chia/Code/maika/docs/deployment/vercel.md) 执行 `npx vercel login`、`npx vercel link`、环境变量配置和 Preview 部署。

## 当前验证状态

已通过：

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npm run build`
- `npx prisma db push`
- `npx prisma db seed`
- `npx vercel --version`
- `npm run test -- tests/unit/root-layout.test.tsx`
- `npm run test -- tests/unit/default-user-seed.test.ts`
- `npx playwright test tests/e2e/login.spec.ts tests/e2e/member-entry.spec.ts --config=/tmp/maika-playwright-existing.config.ts`
- `npx playwright test tests/e2e/admin-settlement.spec.ts --config=/tmp/maika-playwright-existing.config.ts`
- `npx playwright test tests/e2e/content-publishing.spec.ts --config=/tmp/maika-playwright-existing.config.ts`

当前测试覆盖包括：

- 登录权限
- 成员录入
- smoke 重定向
- 成员历史排序
- 榜单聚合
- 成员管理校验
- 销售管理过滤
- 卡酬规则重叠检测
- 结算金额计算与缺失规则状态
- 横幅随机 / 轮播选择逻辑
- 公告可见性与置顶排序
- 横幅与公告发布流
- Excel buffer 生成

未验证：

- Vercel Preview 部署
- 线上环境变量接线
- 线上 PostgreSQL 连通性
- 线上导出接口下载结果
- 线上横幅与公告展示
