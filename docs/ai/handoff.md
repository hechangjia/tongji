# AI Handoff Document

## 当前目标
解决生产环境页面切换时的服务器崩溃问题，并优化系统导航体验（性能与UI细节）。

## 今天已完成内容
- **Bug Fix**: 修复 `/admin/sales` 页面白屏崩溃问题（`React.useState` 在 SSR 环境下的报错），为 `src/components/admin/sales-table.tsx` 补充 `"use client";` 声明。
- **UX/性能优化**:
  - 引入 `next-nprogress-bar`，在 `src/components/app-monitoring.tsx` 中配置页面加载进度条，缓解白屏等待焦虑。
  - 为 `getAdminSalesReviewData` 添加后端缓存（`unstable_cache`），有效解决页面切换时的 1-3s 延迟问题。
- **重构与 a11y**: 在 `src/components/leaderboard-table.tsx` 中应用了 CSS 变量映射替换硬编码色彩（如 `cyan-*` -> `var(--maika-accent)`），并完善无障碍标签。
- **项目基础设施**: 运行了 `/ccg:init`、`/ccg:context`，建立 `.context/` 审计及开发规范目录；运行 `/ccg:review`（多模型代码评审）。

## 当前进行中的内容
- 处理 `LeaderboardTable` 中基于评审建议的轻度视觉调整任务（移除剩余的 `slate` 硬编码）。

## 剩余工作
- 移除 `LeaderboardTable` 等 UI 组件中残余的 `slate-*` 色彩硬编码（如 `text-slate-900` 需映射至 `var(--maika-ink)` / `var(--foreground)` 等）。
- 根据项目规划探索后续新的业务功能。

## 关键决策和约束
- **缓存应用**: 必须基于 `unstable_cache` 并明确配置失效 Tag，以平衡数据新鲜度与首屏性能。
- **UI 色彩**: 严禁硬编码（尤其避免直接写入 Tailwind 原始色阶），必须使用 `globals.css` 中的 `maika-*` 变量体系实现多主题兼容。
- **代码规范**: 开发前遵循 `.context/prefs/workflow.md`，执行前/后需执行规范化审查流程。

## 重要文件路径
- `src/components/leaderboard-table.tsx`：最新重构的排行榜表格 UI。
- `src/components/admin/sales-table.tsx`：原引起崩溃的表格页面（现已加客户端渲染指令）。
- `src/server/services/leaderboard-cache.ts`：数据缓存池。
- `src/app/globals.css`：核心的主题变量及 CSS Tokens 定义。
- `.context/` 目录：包含项目编码和提交流程规范。

## 当前阻塞和风险
- 目前无致命阻塞（编译通过，构建成功）。
- 风险点在于若进一步调整全部组件以替换 `slate`，需确保覆盖测试环境以验证多主题色彩对比度。

## 下次启动后优先执行的 3 个步骤
1. 查看此 Handoff 了解项目状态与最新更改。
2. 决定是否深入替换 `src/components/leaderboard-table.tsx` 及关联组件中剩余的 `slate-*` 硬编码，若不处理则清理当前上下文。
3. 询问用户接下来想要执行的功能迭代任务并获取下一步需求。

## 当前验证状态
- ✅ Bug Fix 构建与 SSR
- ✅ 进度条部署
- ✅ `unstable_cache` 加速
- ✅ 排行榜 UI/a11y 第一阶段重构 (`90/100` CCG 评审分)
