"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { groupSchema, groupUpdateSchema } from "@/lib/validators/group";
import type { GroupCreateFormState } from "@/app/(admin)/admin/groups/form-state";

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
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.name?.[0] ??
        fieldErrors.slogan?.[0] ??
        fieldErrors.remark?.[0] ??
        fieldErrors.leaderUserId?.[0] ??
        "请检查小组信息",
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
      message: "该小组名称已存在，请更换后重试",
      values: fallbackValues,
    };
  }

  await db.group.create({
    data: {
      name: parsedInput.data.name,
      slogan: parsedInput.data.slogan,
      remark: parsedInput.data.remark,
      leaderUserId: parsedInput.data.leaderUserId,
    },
  });

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

  const parsedInput = groupUpdateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    slogan: formData.get("slogan"),
    remark: formData.get("remark"),
    leaderUserId: formData.get("leaderUserId"),
  });

  const existingGroup = await db.group.findUnique({
    where: { name: parsedInput.name },
    select: { id: true },
  });

  if (existingGroup && existingGroup.id !== parsedInput.id) {
    redirect("/admin/groups?notice=该小组名称已存在，请更换后重试");
  }

  await db.group.update({
    where: { id: parsedInput.id },
    data: {
      name: parsedInput.name,
      slogan: parsedInput.slogan,
      remark: parsedInput.remark,
      leaderUserId: parsedInput.leaderUserId,
    },
  });

  revalidatePath("/admin/groups");
  redirect("/admin/groups?notice=小组信息已更新");
}
