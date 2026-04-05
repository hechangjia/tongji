"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessLeader, getDefaultRedirectPath } from "@/lib/permissions";
import { leaderGroupProfileUpdateSchema } from "@/lib/validators/group";
import { updateLeaderGroupProfile } from "@/server/services/group-service";

function appendNotice(notice: string, tone: "success" | "error" = "success") {
  return `/leader/group?notice=${encodeURIComponent(notice)}&noticeTone=${tone}`;
}

async function requireLeaderSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fleader%2Fgroup");
  }

  if (!canAccessLeader(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

function pickLeaderGroupFieldErrorMessage(fieldErrors: {
  slogan?: string[];
  remark?: string[];
}) {
  return fieldErrors.slogan?.[0] ?? fieldErrors.remark?.[0] ?? "请检查小组信息";
}

export async function updateLeaderGroupProfileAction(formData: FormData) {
  const session = await requireLeaderSession();
  const parsedInput = leaderGroupProfileUpdateSchema.safeParse({
    slogan: formData.get("slogan"),
    remark: formData.get("remark"),
  });

  if (!parsedInput.success) {
    redirect(appendNotice(pickLeaderGroupFieldErrorMessage(parsedInput.error.flatten().fieldErrors), "error"));
  }

  try {
    await updateLeaderGroupProfile(session.user.id, {
      slogan: parsedInput.data.slogan,
      remark: parsedInput.data.remark,
    });
  } catch (error) {
    redirect(appendNotice(error instanceof Error ? error.message : "操作失败", "error"));
  }

  revalidatePath("/leader/group");
  revalidatePath("/admin/groups");
  redirect(appendNotice("小组信息已更新"));
}
