# Vercel 部署说明

## 当前预部署检查结果

已完成：

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npx vercel --version`

检查结果：

- 全局 `vercel` 命令不存在
- `npx vercel` 可用，CLI 版本为 `50.37.1`

因此本项目推荐直接使用 `npx vercel` 进行部署。

## 必要环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `AUTH_SECRET` | 是 | Auth.js 会话签名密钥 |
| `AUTH_TRUST_HOST` | 是 | 推荐设为 `true` |

说明：

- 当前实现基于 Auth.js v5 的 host trust 方案，Vercel 上通常不需要额外设置 `NEXTAUTH_URL`
- `AUTH_SECRET` 必须使用新的随机值，不要复用本地开发值

## 推荐部署流程

### 1. 登录 Vercel

```bash
npx vercel login
```

### 2. 绑定当前项目

```bash
npx vercel link
```

### 3. 在 Vercel Project Settings 中配置环境变量

至少配置：

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`

如果你更习惯 CLI，也可以逐个添加：

```bash
npx vercel env add DATABASE_URL preview
npx vercel env add AUTH_SECRET preview
npx vercel env add AUTH_TRUST_HOST preview
```

生产环境同理，把最后一个参数换成 `production`。

### 4. 执行 Preview 部署

```bash
npx vercel
```

如果项目已 link，命令会输出一个 Preview URL。

### 5. 启用 Vercel 原生监控

本项目已经接入以下监控组件：

- `@vercel/analytics`
- `@vercel/speed-insights`

部署后建议在 Vercel 控制台确认：

1. 打开项目侧边栏的 `Analytics`
2. 如提示启用，点击 `Enable`
3. 打开项目侧边栏的 `Speed Insights`
4. 如提示启用，点击 `Enable`
5. 后续在 `Observability` / `Logs` 中查看运行时错误、函数日志和请求情况

补充说明：

- 这两项不需要额外环境变量。
- `Speed Insights` 和 `Analytics` 的数据会在重新部署并产生访问后逐步出现。

## Preview 部署后必须验证的路径

### 基础页面

- `/login`
- `/entry`
- `/records`
- `/leaderboard/daily`
- `/leaderboard/range`

### 管理员页面

- `/admin`
- `/admin/members`
- `/admin/sales`
- `/admin/commission-rules`
- `/admin/settlements`

### 导出接口

以下接口要求管理员登录后验证下载行为：

- `/api/export/daily?date=YYYY-MM-DD`
- `/api/export/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `/api/export/settlement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

## 推荐线上冒烟顺序

1. 用管理员账号登录：`admin / admin123456`
2. 打开 `/admin/settlements`
3. 生成一个日期范围结算
4. 从总榜页导出 Excel
5. 从结算页导出 Excel
6. 用成员账号登录：`member01 / member123456`
7. 打开 `/entry` 并更新一条记录
8. 打开 `/records` 确认能看到更新后的历史记录

## 数据库准备

如果你的线上 PostgreSQL 是空库，先同步 schema，再执行 seed。

本项目当前使用的是：

```bash
npx prisma db push
npx prisma db seed
```

如果线上环境不允许直接从本地连接数据库，改为在你的部署流程中执行等价步骤。

## 回滚思路

- 代码问题：在 Vercel 控制台回滚到上一个正常的 Deployment
- 环境变量问题：修正 Vercel Project Settings 中的环境变量后重新部署
- 数据问题：根据 PostgreSQL 实际写入情况单独处理，不建议盲目重置整库

## 当前已知注意事项

- Next.js 当前会提示 workspace root warning，因为 `/home/chia/package-lock.json` 与项目内 `package-lock.json` 并存；当前不阻塞部署，但建议后续显式配置 `turbopack.root` 或清理多余 lockfile。
- 本地 `.env` 只用于开发验证，不应直接复制到线上。
- Preview 部署尚未真正执行，因此这份文档中的线上验证步骤仍需要手动完成一次。
- 默认管理员与示例成员仅在账号不存在时由 seed 创建；后续再次执行 `npx prisma db seed` 不会覆盖已存在账号的姓名或密码。
