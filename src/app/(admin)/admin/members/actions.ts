"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { refreshLeaderboardCaches } from "@/server/services/leaderboard-cache";
import {
  checkUsernameAvailable,
  checkGroupExists,
  createMember,
  fetchMemberForAssignment,
  fetchGroupForLeaderAssignment,
  updateMemberWithAssignment,
  resetMemberPassword,
  checkMemberDeletable,
  deleteMember,
} from "@/server/services/member-service";
import {
  memberDeleteSchema,
  memberAssignmentUpdateSchema,
  memberProfileUpdateSchema,
  memberResetPasswordSchema,
  memberSchema,
} from "@/lib/validators/member";
import type { MemberCreateFormState } from "@/app/(admin)/admin/members/form-state";

const MEMBER_GROUP_NOT_FOUND_NOTICE = "所选小组不存在，请刷新页面后重试";
const MEMBER_NOT_FOUND_NOTICE = "所选成员不存在，请刷新页面后重试";
const MEMBER_DELETE_BLOCKED_NOTICE = "该成员已有历史数据，不能直接删除，请改为停用";

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

function redirectToMemberNotice(
  message: string,
  tone: "success" | "error" = "error",
): never {
  redirect(`/admin/members?notice=${encodeURIComponent(message)}&noticeTone=${tone}`);
}

function isForeignKeyConflictOnField(error: unknown, field: string): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2003"
  ) {
    return false;
  }

  if (!("meta" in error) || typeof error.meta !== "object" || error.meta === null) {
    return false;
  }

  const fieldName =
    "field_name" in error.meta && typeof error.meta.field_name === "string"
      ? error.meta.field_name
      : undefined;

  return fieldName?.includes(field) ?? false;
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

  try {
    await checkUsernameAvailable(username);
  } catch {
    return {
      status: "error",
      message: "该账号已存在，请更换后重试",
      values: fallbackValues,
    };
  }

  if (groupId) {
    try {
      await checkGroupExists(groupId);
    } catch {
      return {
        status: "error",
        message: MEMBER_GROUP_NOT_FOUND_NOTICE,
        values: fallbackValues,
      };
    }
  }

  try {
    await createMember({
      username,
      name,
      password,
      groupId: groupId ?? null,
      remark: remark ?? null,
      status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    });
  } catch (error) {
    if (isForeignKeyConflictOnField(error, "groupId")) {
      return {
        status: "error",
        message: MEMBER_GROUP_NOT_FOUND_NOTICE,
        values: fallbackValues,
      };
    }

    throw error;
  }

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
  const memberId = String(formData.get("id") ?? "");
  const hasProfileUpdate = ["username", "name", "remark", "status", "password"].some((field) =>
    formData.has(field),
  );
  const hasAssignmentUpdate = ["role", "groupId"].some((field) => formData.has(field));

  if (!hasProfileUpdate && !hasAssignmentUpdate) {
    redirectToMemberNotice("未检测到可更新内容");
  }

  const parsedProfileInput = hasProfileUpdate
    ? memberProfileUpdateSchema.safeParse({
        id: memberId,
        username: formData.get("username"),
        name: formData.get("name"),
        remark: formData.get("remark"),
        status: formData.get("status"),
        password: formData.get("password"),
      })
    : null;

  if (parsedProfileInput && !parsedProfileInput.success) {
    redirectToMemberNotice(
      pickMemberFieldErrorMessage(parsedProfileInput.error.flatten().fieldErrors),
    );
  }

  const parsedAssignmentInput = hasAssignmentUpdate
    ? memberAssignmentUpdateSchema.safeParse({
        id: memberId,
        role: formData.get("role"),
        groupId: formData.has("groupId") ? formData.get("groupId") : undefined,
      })
    : null;

  if (parsedAssignmentInput && !parsedAssignmentInput.success) {
    redirectToMemberNotice(
      pickMemberFieldErrorMessage(parsedAssignmentInput.error.flatten().fieldErrors),
    );
  }

  if (
    parsedProfileInput?.success &&
    session.user.id === parsedProfileInput.data.id &&
    parsedProfileInput.data.status === "INACTIVE"
  ) {
    redirectToMemberNotice("不能停用当前登录管理员");
  }

  if (
    parsedAssignmentInput?.success &&
    session.user.id === parsedAssignmentInput.data.id &&
    parsedAssignmentInput.data.role !== "ADMIN"
  ) {
    redirectToMemberNotice("不能将当前登录管理员降级");
  }

  if (parsedProfileInput?.success) {
    try {
      await checkUsernameAvailable(parsedProfileInput.data.username, parsedProfileInput.data.id);
    } catch {
      redirectToMemberNotice("该账号已存在，请更换后重试");
    }
  }

  let currentMember:
    | {
        role: string;
        groupId: string | null;
        ledGroup: {
          id: string;
        } | null;
      }
    | null = null;
  let nextGroup:
    | {
        id: string;
        leaderUserId: string | null;
      }
    | null = null;

  if (parsedAssignmentInput?.success) {
    currentMember = await fetchMemberForAssignment(parsedAssignmentInput.data.id);

    if (parsedAssignmentInput.data.groupId) {
      try {
        nextGroup = await fetchGroupForLeaderAssignment(parsedAssignmentInput.data.groupId);
      } catch {
        redirectToMemberNotice(MEMBER_GROUP_NOT_FOUND_NOTICE);
      }
    }
  }

  const updateData: {
    username?: string;
    name?: string;
    role?: "ADMIN" | "LEADER" | "MEMBER";
    groupId?: string | null;
    remark?: string | null;
    status?: UserStatus;
    passwordHash?: string;
  } = {};

  if (parsedProfileInput?.success) {
    updateData.username = parsedProfileInput.data.username;
    updateData.name = parsedProfileInput.data.name;
    updateData.remark = parsedProfileInput.data.remark ?? null;
    updateData.status =
      parsedProfileInput.data.status === "ACTIVE" ? UserStatus.ACTIVE : UserStatus.INACTIVE;

    if (parsedProfileInput.data.password) {
      updateData.passwordHash = await hashPassword(parsedProfileInput.data.password);
    }
  }

  const sideEffects: {
    clearLeaderFromGroupId?: string;
    demoteLeaderUserId?: string;
    setLeaderOnGroupId?: string;
  } = {};

  if (parsedAssignmentInput?.success) {
    updateData.role = parsedAssignmentInput.data.role;
    updateData.groupId = parsedAssignmentInput.data.groupId ?? null;

    if (
      currentMember?.ledGroup?.id &&
      (parsedAssignmentInput.data.role !== "LEADER" ||
        currentMember.ledGroup.id !== parsedAssignmentInput.data.groupId)
    ) {
      sideEffects.clearLeaderFromGroupId = currentMember.ledGroup.id;
    }

    if (
      parsedAssignmentInput.data.role === "LEADER" &&
      nextGroup?.leaderUserId &&
      nextGroup.leaderUserId !== parsedAssignmentInput.data.id
    ) {
      sideEffects.demoteLeaderUserId = nextGroup.leaderUserId;
    }

    if (parsedAssignmentInput.data.role === "LEADER" && parsedAssignmentInput.data.groupId) {
      sideEffects.setLeaderOnGroupId = parsedAssignmentInput.data.groupId;
    }
  }

  try {
    await updateMemberWithAssignment(memberId, updateData, sideEffects);
  } catch (error) {
    if (isForeignKeyConflictOnField(error, "groupId")) {
      redirectToMemberNotice(MEMBER_GROUP_NOT_FOUND_NOTICE);
    }

    throw error;
  }

  revalidatePath("/admin/members");
  refreshLeaderboardCaches();
  redirectToMemberNotice("成员信息已更新", "success");
}

export async function resetMemberPasswordAction(formData: FormData) {
  await requireAdminSession();
  const parsedInput = memberResetPasswordSchema.parse({
    id: formData.get("id"),
    username: formData.get("username"),
  });

  const resetPasswordValue = `${parsedInput.username}123456`;

  await resetMemberPassword(parsedInput.id, resetPasswordValue);

  revalidatePath("/admin/members");
  redirect(
    `/admin/members?notice=${encodeURIComponent(
      `密码已重置为 ${resetPasswordValue}`,
    )}`,
  );
}

export async function deleteMemberAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsedInput = memberDeleteSchema.parse({
    id: formData.get("id"),
  });

  if (parsedInput.id === session.user.id) {
    redirectToMemberNotice("不能删除当前登录管理员");
  }

  try {
    await checkMemberDeletable(parsedInput.id);
  } catch (error) {
    redirectToMemberNotice(error instanceof Error ? error.message : "删除失败");
  }

  await deleteMember(parsedInput.id);

  revalidatePath("/admin/members");
  refreshLeaderboardCaches();
  redirectToMemberNotice("成员已删除", "success");
}
