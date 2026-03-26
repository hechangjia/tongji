"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/permissions";
import { loginSchema } from "@/lib/validators/auth";

export type LoginFormState = {
  error: string | null;
};

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
