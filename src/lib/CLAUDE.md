[根目录](../../CLAUDE.md) > [src](../) > **lib**

# Core Library Module

## 模块职责

提供全局基础设施：认证、环境变量、数据库连接、权限判断、密码处理、登录节流、主题与共享类型定义。

## 入口与启动

无单一入口；由页面、Action、服务层按需引入。

关键文件：
- `auth.ts`
- `env.ts`
- `db.ts`
- `permissions.ts`
- `password.ts`
- `rate-limit.ts`
- `theme.ts`
- `auth-session-cookie.ts`

## 对外接口

- 认证：`auth`, `handlers`, `signIn`, `signOut`
- 权限：`canAccessAdmin`, `canAccessLeader`, `canAccessMemberArea`
- 导航：`getDefaultRedirectPath`, `buildLoginRedirect`, `sanitizeCallbackUrl`
- 环境：`env`
- 主题：`buildMaikaThemeBootstrapScript()` 等
- Cookie 探测：`hasAuthSessionCookie()`

## 关键依赖与配置

- `env.ts` 当前校验：
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_TRUST_HOST`
  - `INVITE_CODE`
- `auth.ts`：
  - Auth.js Credentials Provider
  - JWT session 2 小时
  - 每 5 分钟复查用户状态
- `permissions.ts`：
  - 路由识别函数与默认跳转规则
- `rate-limit.ts`：登录节流

Validators 当前共 13 个：
- `auth.ts`
- `sales.ts`
- `identifier-sale.ts`
- `leader-workbench.ts`
- `commission.ts`
- `settlement.ts`
- `member.ts`
- `group.ts`
- `banner.ts`
- `announcement.ts`
- `codes.ts`
- `reminder.ts`
- `target.ts`

## 数据模型

Core lib 主要关心：
- `User`
- `Role`
- `UserStatus`

但本层更多是规则与适配，不直接承载业务 DTO。

## 测试与质量

- `tests/unit/auth.test.ts`
- `tests/unit/codes-validation.test.ts`
- `tests/unit/content-validators.test.ts`
- `tests/unit/identifier-sale-validation.test.ts`
- `tests/unit/leader-workbench-validation.test.ts`
- `tests/unit/theme-palette.test.tsx`

## 常见问题 (FAQ)

### 为什么 `env.ts` 里有开发态默认 secret？
为了本地开发可启动，但生产态仍要求显式安全配置。

### 为什么权限既在 `proxy.ts`，又在 `permissions.ts`？
`permissions.ts` 是纯规则库，`proxy.ts` 是入口执行层；布局和 Action 也会复用这些规则。

### Auth.js 的用户状态为何需要定期复查？
避免禁用用户在 JWT 仍有效时继续长期访问系统。

## 相关文件清单

- `src/lib/auth.ts`
- `src/lib/env.ts`
- `src/lib/db.ts`
- `src/lib/permissions.ts`
- `src/lib/password.ts`
- `src/lib/rate-limit.ts`
- `src/lib/auth-session-cookie.ts`
- `src/lib/validators/`

## 变更记录 (Changelog)

| Date | Description |
|------|-------------|
| 2026-04-08T09:29:56.000Z | Added `INVITE_CODE` and rate-limit coverage; refreshed Auth.js JWT/session behavior and validator inventory. |
