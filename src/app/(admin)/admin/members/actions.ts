"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserStatus } from "@prisma/client";
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

function pickMemberFieldErrorMessage(fieldErrors: {
  id?: string[];
  username?: string[];
  name?: string[];
  role?: string[];
  groupId?: string[];
  remark?: string[];
  password?: string[];
  status?: string[];
}) {
  return (
    fieldErrors.username?.[0] ??
    fieldErrors.name?.[0] ??
    fieldErrors.role?.[0] ??
    fieldErrors.groupId?.[0] ??
    fieldErrors.remark?.[0] ??
    fieldErrors.password?.[0] ??
    fieldErrors.status?.[0] ??
    fieldErrors.id?.[0] ??
    "请检查成员信息"
  );
}

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

  const rawValues = {
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    groupId: formData.get("groupId"),
    remark: formData.get("remark"),
    status: formData.get("status"),
  };
  const parsedInput = memberSchema.safeParse(rawValues);

  const fallbackValues = {
    username: String(formData.get("username") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: "",
    groupId: String(formData.get("groupId") ?? ""),
    remark: String(formData.get("remark") ?? ""),
    status:
      formData.get("status") === "INACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const),
  };

  if (!parsedInput.success) {
    return {
      status: "error",
      message: pickMemberFieldErrorMessage(parsedInput.error.flatten().fieldErrors),
      values: fallbackValues,
    };
  }

  const { username, name, password, groupId, remark, status } = parsedInput.data;
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
      role: "MEMBER",
      groupId: groupId ?? null,
      remark: remark ?? null,
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
      groupId: "",
      remark: "",
      status: "ACTIVE",
    },
  };
}

export async function updateMemberAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsedInput = memberUpdateSchema.safeParse({
    id: formData.get("id"),
    username: formData.get("username"),
    name: formData.get("name"),
    role: formData.get("role"),
    groupId: formData.get("groupId"),
    remark: formData.get("remark"),
    status: formData.get("status"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    redirect(
      `/admin/members?notice=${pickMemberFieldErrorMessage(parsedInput.error.flatten().fieldErrors)}`,
    );
  }

  if (session.user.id === parsedInput.data.id && parsedInput.data.status === "INACTIVE") {
    redirect("/admin/members?notice=不能停用当前登录管理员");
  }

  if (session.user.id === parsedInput.data.id && parsedInput.data.role !== "ADMIN") {
    redirect("/admin/members?notice=不能将当前登录管理员降级");
  }

  const existingUser = await db.user.findUnique({
    where: { username: parsedInput.data.username },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== parsedInput.data.id) {
    redirect("/admin/members?notice=该账号已存在，请更换后重试");
  }

  const currentMember = await db.user.findUnique({
    where: { id: parsedInput.data.id },
    select: {
      ledGroup: {
        select: {
          id: true,
        },
      },
    },
  });

  if (parsedInput.data.role === "LEADER" && !parsedInput.data.groupId) {
    redirect("/admin/members?notice=组长必须绑定所属小组");
  }

  const nextGroup =
    parsedInput.data.role === "LEADER" && parsedInput.data.groupId
      ? await db.group.findUnique({
          where: { id: parsedInput.data.groupId },
          select: {
            id: true,
            leaderUserId: true,
          },
        })
      : null;

  if (parsedInput.data.role === "LEADER" && !nextGroup) {
    redirect("/admin/members?notice=所选小组不存在，请刷新页面后重试");
  }

  const passwordHash = parsedInput.data.password
    ? await hashPassword(parsedInput.data.password)
    : undefined;

  const operations: Array<
    ReturnType<typeof db.group.update> | ReturnType<typeof db.user.update> | ReturnType<typeof db.user.updateMany>
  > = [];

  if (
    currentMember?.ledGroup?.id &&
    (parsedInput.data.role !== "LEADER" || currentMember.ledGroup.id !== parsedInput.data.groupId)
  ) {
    operations.push(
      db.group.update({
        where: { id: currentMember.ledGroup.id },
        data: {
          leaderUserId: null,
        },
      }),
    );
  }

  if (
    parsedInput.data.role === "LEADER" &&
    nextGroup?.leaderUserId &&
    nextGroup.leaderUserId !== parsedInput.data.id
  ) {
    operations.push(
      db.user.updateMany({
        where: {
          id: nextGroup.leaderUserId,
          role: "LEADER",
        },
        data: {
          role: "MEMBER",
        },
      }),
    );
  }

  operations.push(
    db.user.update({
      where: { id: parsedInput.data.id },
      data: {
        username: parsedInput.data.username,
        name: parsedInput.data.name,
        role: parsedInput.data.role,
        groupId: parsedInput.data.groupId ?? null,
        remark: parsedInput.data.remark ?? null,
        status:
          parsedInput.data.status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        ...(passwordHash
          ? {
              passwordHash,
            }
          : {}),
      },
    }),
  );

  if (parsedInput.data.role === "LEADER" && parsedInput.data.groupId) {
    operations.push(
      db.group.update({
        where: { id: parsedInput.data.groupId },
        data: {
          leaderUserId: parsedInput.data.id,
        },
      }),
    );
  }

  await db.$transaction(operations);

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
