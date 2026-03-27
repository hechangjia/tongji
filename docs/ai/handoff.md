# Handoff

## 当前状态

- 本分支已完成校园电话卡新流程的 phase-1 foundation。
- phase-1 范围是：`LEADER` 角色、`Group` 模型、自助注册、小组管理、成员分组/备注/组长联动、leader 导航与路由骨架。
- 识别码导入/库存/分发、预发放、识别码绑定销售、佣金与结算重写还没有开始实现。
- 当前工作树还有未提交变更：
  - phase-1 文档同步
  - 累计统计服务对 `LEADER` 角色的类型兼容修复

## 本阶段已落地能力

- 角色从双角色扩展为 `ADMIN / LEADER / MEMBER`。
- `/login` 现在支持成员自助注册；注册只会创建并激活 `MEMBER`。
- `/admin/groups` 已上线：
  - 创建小组
  - 编辑小组名称、口号、备注
  - 指定、替换、移除组长
- `/admin/members` 已支持：
  - 维护成员角色
  - 维护所属小组
  - 维护管理员备注
  - 保持组长与小组关系一致
- leader 路由和导航已接好：
  - `/leader/group`
  - `/leader/sales`
  - `/leaderboard/groups`

## 当前路由语义

- `/login`
  - 登录入口
  - 成员自助注册入口
  - 已登录用户按角色自动跳转：`ADMIN -> /admin`，`LEADER -> /leader/group`，`MEMBER -> /entry`
- `/admin/groups`
  - 当前是真实可用的小组管理页
- `/leader/group`
  - 当前是真实可用的组长看板基础页，展示当前组长所属小组的基础信息
- `/leader/sales`
  - 当前只是占位页，路由、导航、权限已接通，业务能力后续补
- `/leaderboard/groups`
  - 当前只是共享榜单占位页，后续再接小组排名与筛选

## 关键约束

- 自助注册只允许创建 `MEMBER`，不会直接创建 `LEADER`。
- 同一小组同一时间只能有一个组长。
- 组长必须属于自己的小组。
- 调整成员角色、小组或组长时，必须同步维护 `User.groupId` 和 `Group.leaderUserId`。
- leader 不能访问 admin 路由；member 不能访问 leader/admin 路由。

## Phase 切分

### 已完成的 Phase 1

- `LEADER` + `Group` 数据基础
- 登录页成员自助注册
- 管理员小组管理
- 管理员成员分组/备注/组长联动
- leader 路由、导航、权限骨架

### 仍待后续计划的阶段

- 识别码导入、库存、分发、状态流转
- 预发放记录与识别码绑定销售录单
- `40 / 60` 佣金规则迁移与结算重写
- 小组榜单、导出、分析口径对齐

说明：
- 识别码相关 identifier code 方案仍然 pending。
- 现阶段的小组相关页面属于“基础设施先落地”，不是完整业务闭环。

## 重要文件

- 设计稿：[2026-03-27-campus-card-groups-and-identifier-workflow-design.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/superpowers/specs/2026-03-27-campus-card-groups-and-identifier-workflow-design.md)
- 实施计划：[2026-03-27-campus-card-foundation-phase-1-plan.md](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/docs/superpowers/plans/2026-03-27-campus-card-foundation-phase-1-plan.md)
- 权限与默认跳转：[permissions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/lib/permissions.ts)
- 登录与注册动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(auth)/login/actions.ts)
- 小组管理页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/groups/page.tsx)
- 小组管理动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/groups/actions.ts)
- 成员管理动作：[actions.ts](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(admin)/admin/members/actions.ts)
- 组长看板页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(leader)/leader/group/page.tsx)
- 组长销售占位页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(leader)/leader/sales/page.tsx)
- 小组榜单占位页：[page.tsx](/home/chia/Code/maika/.worktrees/daily-rhythm-top3/src/app/(shared)/leaderboard/groups/page.tsx)

## 相关提交

- `c990cdc` `fix: align leader shell and leaderboard nav`
- `6c21101` `feat: add leader routes and navigation foundation`
- `0f212d1` `fix: enforce member and group leader invariants`
- `8ad1960` `feat: add group-aware member management`
- `c21b578` `fix: harden admin group update and leader conflict handling`
- `ad510ef` `feat: add admin group management`
- `4a187be` `fix: refine register callback and manual-login state`
- `8cec6c2` `fix: enforce member route guards in proxy`
- `8ee9e56` `feat: add leader auth and route guards`
- `68f59c9` `feat: add group and leader schema foundation`

## 当前阻塞和风险

- 代码主线当前无功能性 blocker。
- `npm run build` 已通过，但仍会出现 Next.js workspace root warning：
  - 根目录自动推断到 `/home/chia`
  - 原因是上层目录存在多个 `package-lock.json`
  - 当前不阻塞 lint / type-check / test / build
- 识别码相关 phase 还未开始，现有 `/leader/sales` 与 `/leaderboard/groups` 仍是占位页，不是完整业务能力。

## 下一次会话建议

1. 先确认并提交当前未提交变更：`git status && git diff --stat`
2. 新工作优先从 identifier code phase 开始，不要重复改动 phase-1 foundation
3. 如果后续要接真实 leader 销售或小组榜单，先补设计与计划，再实现

## 验证

- Task 7 focused verification 已通过：
  - `npm run test -- tests/unit/prisma-schema-contract.test.ts tests/unit/auth.test.ts tests/unit/login-actions.test.ts tests/unit/login-page.test.tsx tests/unit/group-management.test.ts tests/unit/admin-groups-page.test.tsx tests/unit/member-management.test.ts tests/unit/member-actions.test.ts tests/unit/app-shell.test.tsx tests/unit/leader-pages.test.tsx`
  - 结果：`10` 个测试文件通过，`57` 个测试通过
- broad verification 已重新跑通：
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test`
  - `npm run build`
- 额外验证：
  - `npm run test -- tests/unit/cumulative-sales-stats-service.test.ts`
- 当前结果：
  - 全量单测：`48` 个测试文件通过，`143` 个测试通过
  - 生产构建：通过
