"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { groupSchema, groupUpdateSchema } from "@/lib/validators/group";
import type { GroupCreateFormState } from "@/app/(admin)/admin/groups/form-state";

const GROUP_NAME_CONFLICT_NOTICE = "该小组名称已存在，请更换后重试";
const GROUP_LEADER_CONFLICT_NOTICE = "该组长已被分配到其他小组，请先解绑后再试";

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fgroups");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

function pickGroupFieldErrorMessage(fieldErrors: {
  id?: string[];
  name?: string[];
  slogan?: string[];
  remark?: string[];
  leaderUserId?: string[];
}) {
  return (
    fieldErrors.name?.[0] ??
    fieldErrors.slogan?.[0] ??
    fieldErrors.remark?.[0] ??
    fieldErrors.leaderUserId?.[0] ??
    fieldErrors.id?.[0] ??
    "请检查小组信息"
  );
}

function isUniqueConflictOnField(error: unknown, field: string): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  if (!("meta" in error) || typeof error.meta !== "object" || error.meta === null) {
    return false;
  }

  const target = "target" in error.meta ? error.meta.target : undefined;

  if (Array.isArray(target)) {
    return target.includes(field);
  }

  if (typeof target === "string") {
    return target.includes(field);
  }

  return false;
}

export async function createGroupAction(
  _previousState: unknown,
  formData: FormData,
): Promise<GroupCreateFormState> {
  await requireAdminSession();

  const rawValues = {
    name: String(formData.get("name") ?? ""),
    slogan: String(formData.get("slogan") ?? ""),
    remark: String(formData.get("remark") ?? ""),
    leaderUserId: String(formData.get("leaderUserId") ?? ""),
  };
  const parsedInput = groupSchema.safeParse(rawValues);
  const fallbackValues = {
    name: rawValues.name,
    slogan: rawValues.slogan,
    remark: rawValues.remark,
    leaderUserId: rawValues.leaderUserId,
  };

  if (!parsedInput.success) {
    return {
      status: "error",
      message: pickGroupFieldErrorMessage(parsedInput.error.flatten().fieldErrors),
      values: fallbackValues,
    };
  }

  const existingGroup = await db.group.findUnique({
    where: { name: parsedInput.data.name },
    select: { id: true },
  });

  if (existingGroup) {
    return {
      status: "error",
      message: GROUP_NAME_CONFLICT_NOTICE,
      values: fallbackValues,
    };
  }

  try {
    await db.group.create({
      data: {
        name: parsedInput.data.name,
        slogan: parsedInput.data.slogan,
        remark: parsedInput.data.remark,
        leaderUserId: parsedInput.data.leaderUserId,
      },
    });
  } catch (error) {
    if (isUniqueConflictOnField(error, "leaderUserId")) {
      return {
        status: "error",
        message: GROUP_LEADER_CONFLICT_NOTICE,
        values: fallbackValues,
      };
    }

    if (isUniqueConflictOnField(error, "name")) {
      return {
        status: "error",
        message: GROUP_NAME_CONFLICT_NOTICE,
        values: fallbackValues,
      };
    }

    throw error;
  }

  revalidatePath("/admin/groups");

  return {
    status: "success",
    message: "小组创建成功",
    values: {
      name: "",
      slogan: "",
      remark: "",
      leaderUserId: "",
    },
  };
}

export async function updateGroupAction(formData: FormData) {
  await requireAdminSession();

  const parsedInput = groupUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.has("name") ? formData.get("name") : undefined,
    slogan: formData.has("slogan") ? formData.get("slogan") : undefined,
    remark: formData.has("remark") ? formData.get("remark") : undefined,
    leaderUserId: formData.has("leaderUserId")
      ? formData.get("leaderUserId")
      : undefined,
  });

  if (!parsedInput.success) {
    redirect(
      `/admin/groups?notice=${pickGroupFieldErrorMessage(parsedInput.error.flatten().fieldErrors)}`,
    );
  }

  const updateData: {
    name?: string;
    slogan?: string | null;
    remark?: string | null;
    leaderUserId?: string | null;
  } = {};

  if (formData.has("name") && parsedInput.data.name !== undefined) {
    updateData.name = parsedInput.data.name;
  }

  if (formData.has("slogan")) {
    updateData.slogan = parsedInput.data.slogan ?? null;
  }

  if (formData.has("remark")) {
    updateData.remark = parsedInput.data.remark ?? null;
  }

  if (formData.has("leaderUserId")) {
    updateData.leaderUserId = parsedInput.data.leaderUserId ?? null;
  }

  if (Object.keys(updateData).length === 0) {
    redirect("/admin/groups?notice=未检测到可更新内容");
  }

  if (updateData.name) {
    const existingGroup = await db.group.findUnique({
      where: { name: updateData.name },
      select: { id: true },
    });

    if (existingGroup && existingGroup.id !== parsedInput.data.id) {
      redirect(`/admin/groups?notice=${GROUP_NAME_CONFLICT_NOTICE}`);
    }
  }

  try {
    await db.group.update({
      where: { id: parsedInput.data.id },
      data: updateData,
    });
  } catch (error) {
    if (isUniqueConflictOnField(error, "leaderUserId")) {
      redirect(`/admin/groups?notice=${GROUP_LEADER_CONFLICT_NOTICE}`);
    }

    if (isUniqueConflictOnField(error, "name")) {
      redirect(`/admin/groups?notice=${GROUP_NAME_CONFLICT_NOTICE}`);
    }

    throw error;
  }

  revalidatePath("/admin/groups");
  redirect("/admin/groups?notice=小组信息已更新");
}
