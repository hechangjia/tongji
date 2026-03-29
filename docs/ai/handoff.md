# Handoff

## 当前状态

- 当前分支已经不止是最初的 phase-1 foundation。
- 已完成范围：
  - 三角色基础：`ADMIN / LEADER / MEMBER`
  - 成员自助注册、权限分流、导航骨架
  - 小组管理、组长指派、成员分组与角色维护
  - 管理员识别码 / 新生线索导入与按成员分发
  - 成员识别码成交工作台
  - 组长督战工作台与组内调度 mutation
  - 共享小组榜单与成员明细权限裁剪
  - 组长工作台状态桥接与强审计链路
  - 成员历史记录中的识别码成交明细
  - 旧 `40 / 60` 日汇总与新 `IdentifierSale` 事实流的桥接
- 当前代码已经覆盖“管理员导入和分发 -> 组长督战与组内调度 -> 成员录单 -> 旧汇总同步保留”的 phase-1.5 闭环。
- 当前还没有对真实 Neon 数据库执行最新 migration；这一步还停留在代码已准备、数据库未落地的状态。

## 已实现功能

### 账号、权限、导航

- `/login` 支持成员自助注册，注册后默认创建并激活 `MEMBER`
- 登录后按角色自动跳转：
  - `ADMIN -> /admin`
  - `LEADER -> /leader/group`
  - `MEMBER -> /entry`
- `ADMIN / LEADER / MEMBER` 三角色路由保护已接通
- 导航已接入：
  - 管理员首页与后台模块
  - 组长入口
  - 成员录入与历史记录
  - 共享榜单入口

### 管理员端

- `/admin/groups`
  - 创建小组
  - 编辑小组名称、口号、备注
  - 指定 / 更换 / 移除组长
- `/admin/members`
  - 维护成员角色
  - 维护成员所属小组
  - 维护管理员备注
  - 维护管理员自己的显示姓名与密码
- `/admin/codes`
  - 导入识别码文件（`.xlsx` / `.csv`）
  - 导入新生 QQ 文件（最少两列：`QQ号`、`专业`）
  - 新生线索按 `QQ号` 去重
  - 查看识别码库存状态
  - 查看线索池状态
  - 批量把识别码分发给成员
  - 批量把新生线索分发给成员
- `/admin/sales`
  - 仍然维护旧 `SalesRecord` 口径的销售记录
- `/admin/commission-rules`
  - 维护卡酬规则
- `/admin/settlements`
  - 继续基于旧汇总 / 旧规则做结算
- `/admin/banners`、`/admin/announcements`
  - 横幅一言与全站公告后台

### 成员端

- `/entry`
  - 顶部仍展示今日目标、自我趋势、最近提醒
  - 已升级成双轨工作台：
    - 主入口：识别码成交
    - 过渡入口：旧 `40 / 60` 日汇总录入
  - 识别码成交主入口支持：
    - 选择自己名下、尚未售出的识别码
    - 选择套餐类型：`40 / 60`
    - 选择新生来源：
      - 已分配线索
      - 手动填写 `QQ号 + 专业`
    - 录入备注
  - 手填 `QQ号 + 专业` 时：
    - 若 QQ 不存在，会自动创建线索
    - 若 QQ 已存在，会直接复用
    - 若该 QQ 已分配给别人且未转化，会拒绝“抢线索”
    - 若该 QQ 已转化，会拒绝重复成交
  - 成交成功后会自动：
    - 写入 `IdentifierSale`
    - 把识别码状态改成 `SOLD`
    - 把对应线索改成 `CONVERTED`
    - 同步更新当天旧 `SalesRecord`
- `/records`
  - 保留旧日汇总记录
  - 额外展示识别码成交明细：
    - 成交日期
    - 识别码
    - 套餐类型
    - `QQ号 / 专业`
    - 来源标签（管理员分配线索 / 成员手填）

### 组长与共享页面

- `/leader/group`
  - 已接通权限与基础页
- `/leader/sales`
  - 已升级为组长督战工作台
  - 已接通：
    - 顶部摘要条
    - 组内成员冲榜视图
    - 各组排名变化视图
    - 线索推进区
    - 识别码调度区
    - 审计时间线
  - 已接通 server actions：
    - 手工创建自主获客跟进项
    - 组内改派跟进项
    - 跟进状态推进
    - 识别码组内改派 / 回收组池
- `/leaderboard/groups`
  - 已升级为共享小组榜单
  - 匿名访客可看小组级汇总
  - `MEMBER` 仅看小组级汇总
  - `LEADER` 只可展开自己组的成员细节
  - `ADMIN` 可展开任意组成员细节
- `/leaderboard/daily`、`/leaderboard/range`
  - 可继续使用现有排行榜能力

## 已落地的重要业务约束

- 自助注册只允许创建 `MEMBER`
- 同一小组同一时间最多一个组长
- 组长必须属于自己的小组
- 管理员不能把 `ADMIN` 或停用成员设置成组长
- 小组页组长候选人来自“活跃的非管理员成员”，不再只看当前 `LEADER`
- 新生线索上传当前只认：
  - `QQ号`
  - `专业`
- 新生线索全局按 `QQ号` 去重
- `40 / 60` 没有取消，仍然作为后续结算依据
- 识别码成交是新事实源，旧 `SalesRecord` 是兼容汇总
- 如果某个成员某一天已经存在 `IdentifierSale`：
  - 旧版日汇总录入必须拒绝写入
  - 避免新旧两套数据同时写乱当天口径
- 识别码成交会固化 `groupId`，避免后续换组影响历史归属
- 管理员分发识别码时会同步写入 `IdentifierCode.assignedGroupId`
- 管理员分配新生线索时会创建或重开 `PROSPECT_LEAD` 类型的 `GroupFollowUpItem`
- 成员录单若携带 `followUpItemId`，必须校验同组后才能关闭该跟进项
- 组长侧所有重操作都会落 `GroupResourceAuditLog`

## 数据模型变化

- 已新增 / 扩展的核心模型与字段：
  - `Group`
  - `User.role = ADMIN | LEADER | MEMBER`
  - `IdentifierCode`
  - `IdentifierCode.assignedGroupId`
  - `IdentifierCodeImportBatch`
  - `IdentifierCodeAssignment`
  - `ProspectLead`
  - `ProspectLeadImportBatch`
  - `IdentifierSale`
  - `GroupFollowUpItem`
  - `GroupResourceAuditLog`
  - `ProspectLeadStatus.CONVERTED`
- 本轮新增 migration：
  - `prisma/migrations/20260328101000_add_identifier_codes_and_prospect_leads/`
  - `prisma/migrations/20260328112000_add_member_identifier_sales/`
  - `prisma/migrations/20260329183000_add_leader_workbench_and_group_leaderboard/`

## 尚未完全实现的功能

### 识别码相关

- 还没有“预发放记录”这一层过程数据
- 还没有成员端异常状态回退 / 售后回退流
- 还没有“按组分配线索”能力，当前仍是按成员分配
- 还没有识别码历史流转审计页

### 组长与榜单

- 小组榜单导出和更深趋势分析还没接上
- 小组维度与结算口径还没有统一切到新事实模型

### 结算与规则

- 结算还没有改造成基于 `IdentifierSale` 的统一事实源
- `40 / 60` 规则虽然保留，但结算重写还没做
- 旧 `SalesRecord` 目前仍是管理员审核、结算与部分报表的兼容来源

### 部署与真实数据库

- 最新 schema / migration 尚未应用到真实 Neon
- 线上还没有针对 `/admin/codes`、`/entry` 新流程做正式联调验收
- 组长工作台与共享小组榜单只在本地 / 测试库完成 smoke 验证，线上还没有正式验收

## 新电脑快速重启项目

### 1. 拉代码

```bash
git clone https://github.com/hechangjia/tongji.git
cd tongji
git checkout main
git pull
```

### 2. 安装环境

- Node.js 20+
- npm
- PostgreSQL 16+，或等价本地 / Docker PostgreSQL

### 3. 安装依赖

```bash
npm install
```

### 4. 准备环境变量

```bash
cp .env.example .env
```

至少确认：

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`

### 5. 初始化本地数据库

本地空库快速启动：

```bash
npx prisma db push
npx prisma db seed
```

如果你是要接一套已经存在数据的数据库，先确认 schema 是否已经包含：

- `DailyTarget`
- `MemberReminder`
- `IdentifierCode`
- `ProspectLead`
- `IdentifierSale`

真实 / 共享数据库不要直接无脑 `db push`，优先按迁移落地。

### 6. 启动开发

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

### 7. 建议先验收的页面

- `/login`
- `/admin/groups`
- `/admin/members`
- `/admin/codes`
- `/entry`
- `/records`
- `/admin/settlements`
- `/leader/sales`
- `/leaderboard/groups`

## 推荐先看的文档

- 总览与本地启动：[README.md](/home/chia/Code/maika/README.md)
- 管理员识别码 / 线索导入计划：[2026-03-28-admin-codes-and-prospect-import-plan.md](/home/chia/Code/maika/docs/superpowers/plans/2026-03-28-admin-codes-and-prospect-import-plan.md)
- 成员识别码工作台设计：[2026-03-28-member-identifier-workspace-design.md](/home/chia/Code/maika/docs/superpowers/specs/2026-03-28-member-identifier-workspace-design.md)
- 成员识别码工作台计划：[2026-03-28-member-identifier-workspace-plan.md](/home/chia/Code/maika/docs/superpowers/plans/2026-03-28-member-identifier-workspace-plan.md)

## 关键代码入口

- 小组 / 组长约束：
  - [group-service.ts](/home/chia/Code/maika/src/server/services/group-service.ts)
  - [actions.ts](/home/chia/Code/maika/src/app/%28admin%29/admin/groups/actions.ts)
- 管理员识别码与线索后台：
  - [page.tsx](/home/chia/Code/maika/src/app/%28admin%29/admin/codes/page.tsx)
  - [admin-code-service.ts](/home/chia/Code/maika/src/server/services/admin-code-service.ts)
  - [codes.ts](/home/chia/Code/maika/src/lib/validators/codes.ts)
- 成员识别码工作台：
  - [page.tsx](/home/chia/Code/maika/src/app/%28member%29/entry/page.tsx)
  - [sales-entry-page-client.tsx](/home/chia/Code/maika/src/components/sales-entry-page-client.tsx)
  - [member-identifier-sale-service.ts](/home/chia/Code/maika/src/server/services/member-identifier-sale-service.ts)
- 组长工作台与共享榜单：
  - [page.tsx](/home/chia/Code/maika/src/app/%28leader%29/leader/sales/page.tsx)
  - [actions.ts](/home/chia/Code/maika/src/app/%28leader%29/leader/sales/actions.ts)
  - [leader-workbench-service.ts](/home/chia/Code/maika/src/server/services/leader-workbench-service.ts)
  - [group-leaderboard-service.ts](/home/chia/Code/maika/src/server/services/group-leaderboard-service.ts)
  - [page.tsx](/home/chia/Code/maika/src/app/%28shared%29/leaderboard/groups/page.tsx)
  - [member-identifier-sale-form.tsx](/home/chia/Code/maika/src/components/member-identifier-sale-form.tsx)
  - [member-identifier-sale-service.ts](/home/chia/Code/maika/src/server/services/member-identifier-sale-service.ts)
- 旧汇总桥接：
  - [sales-service.ts](/home/chia/Code/maika/src/server/services/sales-service.ts)
- 成员历史记录：
  - [records/page.tsx](/home/chia/Code/maika/src/app/%28member%29/records/page.tsx)
  - [my-records-table.tsx](/home/chia/Code/maika/src/components/my-records-table.tsx)

## 本次最新验证

本次收尾时已重新实际运行并通过：

```bash
npm test -- tests/unit/identifier-sale-validation.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/records-page.test.tsx tests/unit/sales-service-identifier-bridge.test.ts tests/unit/admin-code-service.test.ts tests/unit/admin-codes-actions.test.ts tests/unit/admin-codes-page.test.tsx tests/unit/prisma-schema-contract.test.ts
npx eslint src/lib/validators/identifier-sale.ts src/server/services/member-identifier-sale-service.ts src/server/services/sales-service.ts src/server/services/admin-code-service.ts src/app/'(member)'/entry/actions.ts src/app/'(member)'/entry/form-state.ts src/app/'(member)'/entry/page.tsx src/components/sales-entry-page-client.tsx src/components/member-identifier-sale-form.tsx src/components/member-identifier-sale-history.tsx src/app/'(member)'/records/page.tsx src/components/my-records-table.tsx tests/unit/identifier-sale-validation.test.ts tests/unit/member-identifier-sale-service.test.ts tests/unit/member-identifier-entry-action.test.ts tests/unit/entry-page.test.tsx tests/unit/sales-entry-action.test.ts tests/unit/records-page.test.tsx tests/unit/sales-service-identifier-bridge.test.ts tests/unit/admin-code-service.test.ts tests/unit/prisma-schema-contract.test.ts
npx tsc --noEmit
npm run build
```

结果：

- focused unit tests：`11` 个文件，`43` 个测试通过
- targeted ESLint：通过
- TypeScript：通过
- production build：通过

## 下一次会话建议

1. 如果要在真实环境继续推进，先确认并应用最新 Prisma migration
2. 然后做一次真实管理员 / 成员账号联调，重点验证：
   - `/admin/codes`
   - `/entry`
   - `/records`
3. 下一阶段优先级建议：
   - 结算改造接 `IdentifierSale`
   - 组长销售页
   - 小组榜单与导出对齐
   - 预发放记录
