[根目录](../../../../CLAUDE.md) > [src](../../../) > [app](../../) > **(leader)/leader**

# Leader Pages Module

## 模块职责

组长模块由两部分组成：
1. `/leader/group`：维护本组口号与备注。
2. `/leader/sales`：完整组长督战工作台，展示成员冲榜、各组排行、跟进项、识别码调度、审计时间线。

`LEADER` 可访问，`ADMIN` 可通过权限函数访问部分 leader 能力，但 `sales/actions.ts` 内部的某些动作强制要求组长身份。

## 入口与启动

- 布局：`src/app/(leader)/layout.tsx`
- 页面：
  - `src/app/(leader)/leader/group/page.tsx`
  - `src/app/(leader)/leader/sales/page.tsx`
- `sales/page.tsx` 并发读取：
  - `getCachedLeaderWorkbenchSnapshot({ leaderUserId })`
  - `getCachedGroupLeaderboard({ currentUserId })`
- 若账号未绑定小组，`sales/page.tsx` 返回空态，不再显示旧占位页。

## 对外接口

### Group 页面
- `updateLeaderGroupProfileAction`
  - 校验：`leaderGroupProfileUpdateSchema`
  - 服务：`updateLeaderGroupProfile()`
  - 刷新：`/leader/group`、`/admin/groups`

### Sales Workbench 动作
位于 `src/app/(leader)/leader/sales/actions.ts`：
- `createManualFollowUpAction`
- `reassignFollowUpAction`
- `updateFollowUpStatusAction`
- `reassignIdentifierCodeAction`

动作共同特征：
- 先鉴权，再 Zod 校验
- 调用 `leader-workbench-service.ts`
- 统一刷新 `refreshLeaderWorkbenchCaches()`、`revalidatePath("/leader/group")`、`revalidatePath("/entry")`
- 通过 query notice 返回操作结果

## 关键依赖与配置

- 权限：`src/lib/permissions.ts` 的 `canAccessLeader()`
- 服务层：
  - `leader-workbench-service.ts`
  - `group-leaderboard-service.ts`
  - `group-service.ts`
  - `member-identifier-sale-service.ts`
- 缓存：`leaderboard-cache.ts` 中
  - `getCachedLeaderWorkbenchSnapshot()`
  - `getCachedGroupLeaderboard()`
  - `refreshLeaderWorkbenchCaches()`
- 组件：
  - `leader-member-ranking-panel.tsx`
  - `leader-group-ranking-panel.tsx`
  - `leader-follow-up-section.tsx`
  - `leader-code-assignment-section.tsx`
  - `leader-audit-timeline.tsx`
  - `group-leaderboard-table.tsx`

## 数据模型

Leader 模块重点依赖：
- `Group`
- `IdentifierCode`
- `ProspectLead`
- `GroupFollowUpItem`
- `GroupResourceAuditLog`
- `IdentifierSale`

工作台快照主要字段：
- `summary`：成员数、今日 40/60、总成交、待跟进数、组池空置识别码数
- `memberRanking`
- `codePool`
- `followUpQueue`
- `auditRows`

审计规则：
- 跟进项状态变化、改派、回收到组池、手动创建都会记录前后快照与原因
- 识别码改派同样记录 `beforeSnapshot` / `afterSnapshot`

## 测试与质量

- 单测：
  - `tests/unit/leader-pages.test.tsx`
  - `tests/unit/leader-sales-actions.test.ts`
  - `tests/unit/leader-group-actions.test.ts`
  - `tests/unit/leader-workbench-service.test.ts`
  - `tests/unit/leader-workbench-mutations.test.ts`
  - `tests/unit/leader-workbench-validation.test.ts`
  - `tests/unit/group-leaderboard-service.test.ts`
- E2E：`tests/e2e/leader-workbench.spec.ts`

## 常见问题 (FAQ)

### 为什么组长页面分成 `/leader/group` 和 `/leader/sales`？
前者维护静态组资料，后者是高频督战操作台，两者职责已拆开。

### 为什么有些 leader action 只允许 `LEADER`，不允许 `ADMIN`？
页面读取允许 Admin 查看部分结果，但动作层需要保留“组长本人操作”的审计边界。

### 为什么共享小组榜单能看到本组成员展开，而不是所有组？
可见范围由 `getVisibleGroupMemberRows()` 控制：Leader 仅看本组，Admin 可看全部，匿名只能看组级总榜。

## 相关文件清单

- `src/app/(leader)/layout.tsx`
- `src/app/(leader)/leader/group/page.tsx`
- `src/app/(leader)/leader/group/actions.ts`
- `src/app/(leader)/leader/sales/page.tsx`
- `src/app/(leader)/leader/sales/actions.ts`
- `src/server/services/leader-workbench-service.ts`
- `src/server/services/group-leaderboard-service.ts`
- `src/server/services/leaderboard-cache.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Corrected module scope from simple group profile page to full leader workbench; added action catalog, snapshot structure, and audit behavior. |
