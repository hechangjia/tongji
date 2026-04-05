"use server";

import { Role } from "@prisma/client";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDefaultRedirectPath, sanitizeCallbackUrl } from "@/lib/permissions";
import { checkRateLimit, cleanupExpiredEntries } from "@/lib/rate-limit";
import { checkUsernameAvailable, createMember } from "@/server/services/member-service";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { LoginFormState, RegisterFormState } from "@/app/(auth)/login/form-state";

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const clientIp = await getClientIp();
  cleanupExpiredEntries();

  const rateLimitResult = checkRateLimit(`login:${clientIp}`, {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimitResult.allowed) {
    const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60_000);
    return {
      error: `登录尝试过于频繁，请 ${retryMinutes} 分钟后重试`,
    };
  }

  const parsedInput = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      error:
        fieldErrors.username?.[0] ??
        fieldErrors.password?.[0] ??
        "请检查登录信息",
    };
  }

  const { username, password, callbackUrl } = parsedInput.data;

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: sanitizeCallbackUrl(callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "账号或密码错误"
            : "登录失败，请稍后重试",
      };
    }

    throw error;
  }

  return {
    error: null,
  };
}

export async function registerMemberAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const parsedInput = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.inviteCode?.[0] ??
        fieldErrors.username?.[0] ?? fieldErrors.password?.[0] ?? "请检查注册信息",
    };
  }

  const { username, password, inviteCode, callbackUrl } = parsedInput.data;

  if (inviteCode !== env.INVITE_CODE) {
    return {
      status: "error",
      message: "邀请码无效，请联系管理员获取正确的邀请码",
    };
  }

  try {
    await checkUsernameAvailable(username);
  } catch {
    return {
      status: "error",
      message: "该账号已存在，请更换后重试",
    };
  }

  try {
    await createMember({
      username,
      name: username,
      password,
      status: "ACTIVE",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: "该账号已存在，请更换后重试",
      };
    }

    throw error;
  }

  const defaultMemberTarget = getDefaultRedirectPath(Role.MEMBER);
  const redirectTo =
    callbackUrl && callbackUrl.trim() !== ""
      ? sanitizeCallbackUrl(callbackUrl)
      : defaultMemberTarget;

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "manual_login",
        message: "注册成功，请使用新账号登录",
      };
    }

    throw error;
  }

  return {
    status: "idle",
    message: null,
  };
}
