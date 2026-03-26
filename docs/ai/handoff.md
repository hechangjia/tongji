# Handoff

## 当前目标

- 暂停前的主目标已从“实现”切换为“线上验收”。
- 当前应优先验证生产站 `https://tongji.662613.xyz` 上这三组新功能：
  - 登录账号可修改
  - `hitokoto` 导入到本地横幅池
  - 前端调色板主题切换

## 今天已完成内容

- 将生产部署区域切到 `sin1`，线上域名已指向新加坡区域。
- 完成并上线榜单性能优化：
  - 日榜 / 总榜 30 秒服务端缓存
  - 成员录入、管理员改销售、管理员改成员姓名后自动刷新榜单缓存
- 将 Vercel Analytics import 对齐到官方推荐写法。
- 完成并推送 `ad24d19 feat: add theme palette and content imports`：
  - 管理员 / 成员登录账号可在成员管理页修改
  - seed 改为按“是否已有管理员角色”判断，不再依赖默认用户名 `admin`
  - 后台横幅页支持从 `hitokoto` 导入一条文案并保存到本地数据库
  - 新增前端调色板，主题保存在当前浏览器 `localStorage`
  - 登录页、壳层背景、横幅、榜单卡片等视觉改为走主题变量
- 当前生产域名已指向最新 deployment：
  - `https://tongji-9jjrcnv1p-changjia-hes-projects.vercel.app`
  - 别名包含 `https://tongji.662613.xyz`

## 当前进行中的内容

- 无正在执行的代码任务。
- 当前处于“等待用户查看线上效果并反馈”的状态。

## 剩余工作

- 手动验收生产站新功能：
  - `/admin/members` 的登录账号修改
  - `/admin/banners` 的 `hitokoto` 导入
  - 全站调色板切换效果
- 检查 Vercel Analytics / Speed Insights 是否开始出数据。
- 如果用户继续优化：
  - 再做主题细节打磨
  - 再做用户名修改后的交互提示优化
  - 再做 `hitokoto` 导入筛选/分类增强

## 关键决策和约束

- 技术栈固定：Next.js App Router + TypeScript + Prisma + PostgreSQL + Auth.js Credentials。
- 角色固定：`MEMBER` / `ADMIN`。
- 套餐固定：`40` / `60`。
- 每人每天仅一条销售记录，`userId + saleDate` 唯一。
- 结算缺规则时必须显式标记，不能按 `0` 结算。
- 横幅一言与公告保持两个独立系统，不合并成内容中心。
- `hitokoto` 采用“后台导入到本地数据库”的方式，不在前台请求主链路实时调用外部接口。
- 主题系统首版采用“浏览器本地持久化”，不入库，不做用户级云同步。
- 榜单缓存 TTL 为 `30` 秒。
- 当前生产区域以 `sin1` 为主；自定义域名访问中，`http` 会 308 跳转到 `https`。

## 重要文件路径

- 交接文档：[docs/ai/handoff.md](/home/chia/Code/maika/docs/ai/handoff.md)
- 成员管理更新逻辑：[actions.ts](/home/chia/Code/maika/src/app/(admin)/admin/members/actions.ts)
- 成员管理表格：[member-table.tsx](/home/chia/Code/maika/src/components/admin/member-table.tsx)
- 成员校验：[member.ts](/home/chia/Code/maika/src/lib/validators/member.ts)
- 默认账号 seed 逻辑：[default-user-seed.ts](/home/chia/Code/maika/src/server/services/default-user-seed.ts)
- 横幅后台 action：[actions.ts](/home/chia/Code/maika/src/app/(admin)/admin/banners/actions.ts)
- `hitokoto` 服务：[hitokoto-service.ts](/home/chia/Code/maika/src/server/services/hitokoto-service.ts)
- 主题配置：[theme.ts](/home/chia/Code/maika/src/lib/theme.ts)
- 调色板组件：[theme-palette.tsx](/home/chia/Code/maika/src/components/theme-palette.tsx)
- 根布局：[layout.tsx](/home/chia/Code/maika/src/app/layout.tsx)
- 全局样式：[globals.css](/home/chia/Code/maika/src/app/globals.css)
- 部署说明：[vercel.md](/home/chia/Code/maika/docs/deployment/vercel.md)

## 当前阻塞和风险

- 最新生产部署已完成，但这轮新增功能尚未做人工线上验收。
- `hitokoto` 依赖外部接口；虽然只在后台导入时触发，但外部服务波动时导入可能失败。
- 主题系统当前只保存在浏览器本地；换设备或清缓存会丢失主题偏好。
- Next.js 仍有 workspace root warning：
  - `/home/chia/package-lock.json`
  - `/home/chia/Code/maika/package-lock.json`
- Vercel Analytics / Speed Insights 数据不会立即出现，存在平台延迟。

## 下次启动后优先执行的 3 个步骤

1. 依次读取 `~/.claude/CLAUDE.md`、项目 `AGENTS.md`、本文件 `docs/ai/handoff.md`。
2. 先检查生产站 `https://tongji.662613.xyz` 是否已上线以下功能：
   - `/admin/members` 可修改登录账号
   - `/admin/banners` 可导入 `hitokoto`
   - 调色板可切换主题
3. 若用户反馈问题，再按对应模块回到：
   - 成员管理链路
   - 横幅导入链路
   - 主题变量 / 调色板链路

## 当前验证状态

- 已通过：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
  - `npm run build`
- 本轮新增测试已通过：
  - `tests/unit/member-actions.test.ts`
  - `tests/unit/default-user-seed.test.ts`
  - `tests/unit/hitokoto-service.test.ts`
  - `tests/unit/banner-import-actions.test.ts`
  - `tests/unit/theme-palette.test.tsx`
  - `tests/unit/leaderboard-actions-revalidation.test.ts`
- 当前未验证：
  - 最新生产站人工点击流程
  - `hitokoto` 线上真实导入一次
  - 主题切换在移动端和微信内置浏览器的表现
  - Analytics / Speed Insights 实际数据回流
