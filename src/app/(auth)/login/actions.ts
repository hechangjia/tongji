"use server";

import { Role, UserStatus } from "@prisma/client";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getDefaultRedirectPath, sanitizeCallbackUrl } from "@/lib/permissions";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { LoginFormState, RegisterFormState } from "@/app/(auth)/login/form-state";

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsedInput = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl"),
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
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.username?.[0] ?? fieldErrors.password?.[0] ?? "请检查注册信息",
    };
  }

  const { username, password, callbackUrl } = parsedInput.data;
  const existingUser = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "该账号已存在，请更换后重试",
    };
  }

  try {
    await db.user.create({
      data: {
        username,
        name: username,
        passwordHash: await hashPassword(password),
        role: Role.MEMBER,
        status: UserStatus.ACTIVE,
      },
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
