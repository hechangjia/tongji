[Root](../../../CLAUDE.md) > [src](../../) > [app](../) > **(auth)/login**

# Auth Pages Module

## Module Purpose

User authentication via username/password credentials. Single login page that redirects authenticated users to their role-based default route.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Credential login form with callback URL support |

## Auth Flow

1. User submits username + password via `login-form` component
2. `loginAction` in `actions.ts` calls `signIn("credentials", ...)` from Auth.js
3. Auth.js `authorize` callback validates via `loginSchema` + `verifyPassword`
4. JWT token issued with `id`, `role`, `status`, `username`
5. Proxy middleware redirects to role-based default route

## Key Files

- `src/app/(auth)/login/page.tsx` -- login page
- `src/app/(auth)/login/actions.ts` -- login server action
- `src/app/(auth)/login/form-state.ts` -- form state types
- `src/components/login-form.tsx` -- login form component
- `src/components/register-form.tsx` -- registration form component
- `src/lib/auth.ts` -- Auth.js configuration
- `src/lib/password.ts` -- bcryptjs hash/verify
- `src/lib/permissions.ts` -- role-based access helpers
- `src/lib/validators/auth.ts` -- login/register schemas
- `src/proxy.ts` -- route protection middleware

## Tests

Unit: `auth`, `login-actions`, `login-page`

E2E: `login.spec.ts`
