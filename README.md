# Maika

校园电话卡销售统计与卡酬结算系统 MVP。

这是一个面向暑期线下校园电话卡销售团队的全栈 Web 应用，目标是把成员每日录入、排行榜、卡酬规则、结算统计和 Excel 导出收敛到一个可长期保存数据的系统里。

## 当前状态

当前版本已经完成本地开发与验证，覆盖以下能力：

- 账号密码登录
- 全站现代化 UI 壳层与移动端抽屉导航
- 成员 / 管理员角色权限控制
- 成员每日录入与同日更新
- 我的记录
- 日榜 / 总榜
- 成员管理
- 销售记录管理
- 卡酬规则管理
- 结算计算
- 登录后全站横幅一言
- 登录后全体公告
- 横幅与公告后台管理
- Excel 导出接口

当前仍未完成的外部步骤：

- Vercel Preview 部署与线上环境变量接入验证

## 技术栈

- Next.js 16 App Router
- TypeScript
- Prisma
- PostgreSQL
- Auth.js Credentials
- Zod
- Vitest
- Playwright
- ExcelJS

## 核心业务规则

- 角色固定为 `MEMBER` / `ADMIN`
- 套餐固定为 `40` / `60`
- 每位成员每天只能有一条销售记录，`userId + saleDate` 唯一
- 结算时必须按销售日期匹配对应生效中的卡酬规则
- 若找不到对应卡酬规则，结算结果必须显式标记为“规则缺失”，不能按 `0` 元处理
- 同一成员的卡酬规则时间段不能重叠

## 页面与路由

### 公共页面

- `/login`
- `/leaderboard/daily`
- `/leaderboard/range`

### 成员页面

- `/entry`
- `/records`

### 管理员页面

- `/admin`
- `/admin/members`
- `/admin/sales`
- `/admin/commission-rules`
- `/admin/settlements`
- `/admin/banners`
- `/admin/announcements`

### 导出接口

以下接口要求管理员登录：

- `/api/export/daily?date=YYYY-MM-DD`
- `/api/export/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `/api/export/settlement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

## 项目结构

```text
src/
  app/
    (auth)/login
    (member)/entry
    (member)/records
    (shared)/leaderboard/daily
    (shared)/leaderboard/range
    (admin)/admin/*
    api/auth/[...nextauth]
    api/export/*
  components/
    app-shell
    app-monitoring
    banner-rotator
    announcement-list
    sales-entry-form
    leaderboard-table
    my-records-table
    admin/*
  lib/
    auth / db / env / password / permissions / validators/*
    content-types
  server/services/
    sales-service
    leaderboard-service
    commission-service
    settlement-service
    export-service
    banner-service
    announcement-service
prisma/
  schema.prisma
  seed.ts
tests/
  unit/*
  e2e/*
docs/
  ai/handoff.md
  deployment/vercel.md
```

## 本地环境要求

- Node.js 20+
- npm
- PostgreSQL 16+，或等价兼容实例

## 环境变量

复制样例：

```bash
cp .env.example .env
```

当前使用的环境变量：

| 变量 | 必填 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串，供 Prisma 和应用运行时使用 |
| `AUTH_SECRET` | 是 | Auth.js 会话签名密钥 |
| `AUTH_TRUST_HOST` | 是 | 预览 / 线上环境建议设为 `true` |

`.env.example` 的默认本地值指向：

```text
postgresql://postgres:postgres@localhost:5432/maika?schema=public
```

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 PostgreSQL

如果本机没有现成 PostgreSQL，可以直接用 Docker：

```bash
docker run -d \
  --name maika-postgres \
  -e POSTGRES_DB=maika \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. 初始化数据库

```bash
npx prisma db push
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问应用

```text
http://localhost:3000
```

## 默认账号

- 初始管理员：`admin / admin123456`
- 初始成员：`member01 / member123456`

补充说明：

- 以上仅用于首轮初始化，`npx prisma db seed` 现在只会在账号不存在时创建默认管理员和示例成员。
- 如果你已经在后台修改过管理员姓名或密码，后续再次执行 seed 不会覆盖现有账号。
- 管理员登录后，可直接在 `/admin/members` 修改自己的显示姓名和密码；当前不支持在后台修改登录用户名。

## 内容系统说明

### 横幅一言

- 登录后全站顶部可见
- 登录页不显示
- 管理员在 `/admin/banners` 管理
- 支持：
  - 启用 / 停用
  - 随机显示
  - 自动轮播
  - 内置一言 + 自定义文案

### 全体公告

- 登录后全站可见
- 登录页不显示
- 管理员在 `/admin/announcements` 管理
- 支持：
  - 多条公告
  - 置顶
  - 发布时间
  - 过期时间
  - 启用 / 停用

## 常用开发命令

### 代码质量

```bash
npm run lint
npx tsc --noEmit
```

### 单元测试

```bash
npm run test
```

### E2E 测试

```bash
npm run test:e2e
```

补充说明：

- 默认 Playwright 配置会自己拉起一个 `next dev` 在 `3100` 端口。
- 如果当前目录已经有常驻 `next dev` 进程，Next.js 16 可能会拒绝再起一个开发实例；这种情况下先停掉现有 dev server 再跑 E2E。

### 构建验证

```bash
npm run build
```

### 数据库

```bash
npx prisma db push
npx prisma db seed
npx prisma validate
```

## 已通过的验证

当前这轮开发中，以下命令已实际运行并通过：

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run test:e2e
npm run build
```

## 使用说明

### 成员流程

1. 登录系统
2. 打开 `/entry`
3. 查看系统自动生成的今日目标、自我趋势和最近提醒
4. 录入当天 `40` / `60` 套餐数量和备注
5. 再次提交同一天数据时，会直接覆盖当天记录，并刷新目标差距与趋势反馈
6. 在 `/records` 查看历史记录

补充说明：

- `/leaderboard/daily` 与 `/leaderboard/range` 当前启用了 30 秒服务端缓存。
- 当成员录入、管理员修改销售记录、管理员修改成员显示姓名后，榜单缓存会自动刷新。
- 如果管理员当天已发送提醒，成员会在 `/entry` 顶部直接看到最近提醒列表。

### 管理员流程

1. 登录系统
2. 在 `/admin` 查看管理入口总览
3. 在 `/admin/members` 创建或维护成员账号，也可以修改自己的显示姓名和登录密码
4. 在 `/admin/insights` 查看今日经营诊断、系统自动生成的成员目标，并直接调整目标或发送站内提醒
5. 在 `/admin/sales` 查看和修改销售记录
6. 在 `/admin/commission-rules` 维护卡酬规则
7. 在 `/admin/settlements` 生成结算结果
8. 在 `/admin/banners` 维护横幅一言与展示模式
9. 在 `/admin/announcements` 发布或置顶全体公告
10. 在总榜或结算页点击“导出 Excel”

## 线上监控

当前项目已内置：

- Vercel Web Analytics
- Vercel Speed Insights

部署到 Vercel 后：

- 在项目侧边栏打开 `Analytics` 查看访问趋势和页面流量
- 在项目侧边栏打开 `Speed Insights` 查看 Core Web Vitals 和路由性能
- 在项目侧边栏打开 `Observability` / `Logs` 查看运行时错误与函数日志

补充说明：

- `Analytics` 和 `Speed Insights` 已接入代码，无需额外环境变量。
- 如果 Vercel 控制台首次进入对应页面时提示 `Enable`，直接在项目级别启用即可。

## 导出说明

导出接口返回 `.xlsx` 文件：

- 日榜导出：按单日输出排名与销量
- 总榜导出：按时间范围输出累计销量
- 结算导出：输出成员销量、状态、应结金额和缺失规则说明

## Vercel 预部署检查结果

当前机器上的预部署检查结果：

- `vercel` 全局命令未安装
- `npx vercel --version` 已验证可用，结果为 `50.37.1`
- 本地构建、测试、E2E、类型检查均已通过

因此推荐直接使用：

```bash
npx vercel
```

更详细的步骤见：

- [docs/deployment/vercel.md](/home/chia/Code/maika/docs/deployment/vercel.md)

## 当前已知注意事项

- Next.js 会提示 workspace root warning，因为 `/home/chia/package-lock.json` 与项目内 `package-lock.json` 并存；当前不阻塞运行和构建。
- `.env` 是本地文件，不应提交。
- 当前共享 Neon 库如果尚未同步 `DailyTarget` / `MemberReminder` 新表，`/entry` 与 `/admin/insights` 会直接报 Prisma 缺表错误；部署前必须先同步 schema。
- 本轮 E2E 是在隔离的本地 PostgreSQL 临时库中验证通过，不建议直接拿共享开发库跑 Playwright。

## 下一步建议

1. 使用 `npx vercel` 完成 Preview 部署
2. 在 Vercel 中配置 `DATABASE_URL`、`AUTH_SECRET`、`AUTH_TRUST_HOST`，并先同步最新 Prisma schema
3. 线上验证 `/login`、`/entry`、`/admin/insights`、`/admin/settlements` 和 3 个导出接口
