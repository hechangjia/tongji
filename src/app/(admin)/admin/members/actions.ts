"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, UserStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { refreshLeaderboardCaches } from "@/server/services/leaderboard-cache";
import {
  memberResetPasswordSchema,
  memberSchema,
  memberUpdateSchema,
} from "@/lib/validators/member";
import type { MemberCreateFormState } from "@/app/(admin)/admin/members/form-state";

function requireAdminSession() {
  return auth().then((session) => {
    if (!session?.user) {
      redirect("/login?callbackUrl=%2Fadmin%2Fmembers");
    }

    if (!canAccessAdmin(session.user)) {
      redirect(getDefaultRedirectPath(session.user.role));
    }

    return session;
  });
}

export async function createMemberAction(
  _previousState: unknown,
  formData: FormData,
): Promise<MemberCreateFormState> {
  await requireAdminSession();

  const parsedInput = memberSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    status: formData.get("status"),
  });

  const fallbackValues = {
    username: String(formData.get("username") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: "",
    status:
      formData.get("status") === "INACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const),
  };

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.username?.[0] ??
        fieldErrors.name?.[0] ??
        fieldErrors.password?.[0] ??
        fieldErrors.status?.[0] ??
        "请检查成员信息",
      values: fallbackValues,
    };
  }

  const { username, name, password, status } = parsedInput.data;
  const existingUser = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "该账号已存在，请更换后重试",
      values: fallbackValues,
    };
  }

  await db.user.create({
    data: {
      username,
      name,
      passwordHash: await hashPassword(password),
      role: Role.MEMBER,
      status: status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    },
  });

  revalidatePath("/admin/members");

  return {
    status: "success",
    message: "成员创建成功",
    values: {
      username: "",
      name: "",
      password: "",
      status: "ACTIVE",
    },
  };
}

export async function updateMemberAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsedInput = memberUpdateSchema.parse({
    id: formData.get("id"),
    username: formData.get("username"),
    name: formData.get("name"),
    status: formData.get("status"),
    password: formData.get("password"),
  });

  if (session.user.id === parsedInput.id && parsedInput.status === "INACTIVE") {
    redirect("/admin/members?notice=不能停用当前登录管理员");
  }

  const existingUser = await db.user.findUnique({
    where: { username: parsedInput.username },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== parsedInput.id) {
    redirect("/admin/members?notice=该账号已存在，请更换后重试");
  }

  await db.user.update({
    where: { id: parsedInput.id },
    data: {
      username: parsedInput.username,
      name: parsedInput.name,
      status:
        parsedInput.status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      ...(parsedInput.password
        ? {
            passwordHash: await hashPassword(parsedInput.password),
          }
        : {}),
    },
  });

  revalidatePath("/admin/members");
  refreshLeaderboardCaches();
  redirect("/admin/members?notice=成员信息已更新");
}

export async function resetMemberPasswordAction(formData: FormData) {
  await requireAdminSession();
  const parsedInput = memberResetPasswordSchema.parse({
    id: formData.get("id"),
    username: formData.get("username"),
  });

  const resetPassword = `${parsedInput.username}123456`;

  await db.user.update({
    where: { id: parsedInput.id },
    data: {
      passwordHash: await hashPassword(resetPassword),
    },
  });

  revalidatePath("/admin/members");
  redirect(
    `/admin/members?notice=${encodeURIComponent(
      `密码已重置为 ${resetPassword}`,
    )}`,
  );
}
