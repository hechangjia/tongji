[根目录](../../../../CLAUDE.md) > [src](../../../) > [app](../../) > **(auth)/login**

# Auth Pages Module

## 模块职责

认证模块同时承担登录与成员自注册。登录使用 Auth.js Credentials Provider；注册需要邀请码，并在成功创建成员后尝试自动登录。

## 入口与启动

- 页面：`src/app/(auth)/login/page.tsx`
- 动作：`src/app/(auth)/login/actions.ts`
- 页面会优先检查 session cookie，再决定是否调用 `auth()`，减少无谓认证读取

## 对外接口

### 登录
- `loginAction`
  - 读取客户端 IP：`const headerStore = await headers(); headerStore.get("x-forwarded-for")`
  - 本地限流：`checkRateLimit()`
  - 校验：`loginSchema`
  - 调用：`signIn("credentials", { redirectTo })`

### 注册
- `registerMemberAction`
  - 校验：`registerSchema`
  - 检查邀请码：`env.INVITE_CODE`
  - 服务：`checkUsernameAvailable()`、`createMember()`
  - 成功后尝试 `signIn()` 自动登录

## 关键依赖与配置

- `src/lib/auth.ts`
  - Auth.js v5
  - JWT session，2 小时过期
  - 每 5 分钟从数据库复查用户状态与角色
- `src/lib/env.ts`
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_TRUST_HOST`
  - `INVITE_CODE`
- `src/lib/password.ts`
- `src/lib/rate-limit.ts`
- `src/lib/validators/auth.ts`
- `src/proxy.ts`

## 数据模型

认证直接依赖：
- `User`
- `UserStatus`
- `Role`

JWT 扩展字段：
- `id`
- `role`
- `status`
- `username`
- `lastCheckedAt`

## 测试与质量

- 单测：
  - `tests/unit/auth.test.ts`
  - `tests/unit/login-actions.test.ts`
  - `tests/unit/login-page.test.tsx`
- E2E：`tests/e2e/login.spec.ts`

## 常见问题 (FAQ)

### 为什么登录动作里没有显式 `redirect()`？
`signIn()` 在成功场景会抛出框架重定向；测试里通过捕获该行为断言目标路径。

### 为什么注册也放在登录页？
当前产品流程较轻量，成员通过邀请码自注册后直接进入成员区域。

### 为什么还有 `INVITE_CODE`，根文档以前却没写？
这是本轮补捞修正的过时信息之一，现已同步到根文档与索引。

## 相关文件清单

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/actions.ts`
- `src/lib/auth.ts`
- `src/lib/env.ts`
- `src/lib/password.ts`
- `src/lib/rate-limit.ts`
- `src/lib/validators/auth.ts`
- `src/proxy.ts`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Added member registration, invite code, cookie pre-check, and login rate-limit details to auth module docs. |
