"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import {
  createAnnouncement,
  toggleAnnouncementPin,
  toggleAnnouncementStatus,
} from "@/server/services/announcement-service";
import { announcementSchema } from "@/lib/validators/announcement";
import type { AnnouncementFormState } from "@/app/(admin)/admin/announcements/form-state";
import { refreshShellContent } from "@/server/services/shell-content-cache";

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fannouncements");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function createAnnouncementAction(
  _previousState: unknown,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await requireAdminSession();

  const rawValues = {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    publishAt: String(formData.get("publishAt") ?? ""),
    expireAt: String(formData.get("expireAt") ?? ""),
    status:
      formData.get("status") === "INACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const),
    isPinned: formData.get("isPinned") === "on" ? "true" : "false",
  };
  const parsedInput = announcementSchema.safeParse(rawValues);

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.title?.[0] ??
        fieldErrors.content?.[0] ??
        fieldErrors.publishAt?.[0] ??
        fieldErrors.expireAt?.[0] ??
        "请检查公告内容",
      values: {
        title: rawValues.title,
        content: rawValues.content,
        publishAt: rawValues.publishAt,
        expireAt: rawValues.expireAt,
        status: rawValues.status,
        isPinned: rawValues.isPinned === "true",
      },
    };
  }

  await createAnnouncement(parsedInput.data);
  refreshShellContent();
  revalidatePath("/admin/announcements");

  return {
    status: "success",
    message: "公告已保存",
    values: {
      title: "",
      content: "",
      publishAt: rawValues.publishAt,
      expireAt: "",
      status: "ACTIVE",
      isPinned: false,
    },
  };
}

const announcementStatusToggleSchema = z.object({
  id: z.string().min(1, "公告 ID 缺失"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function toggleAnnouncementStatusAction(formData: FormData) {
  await requireAdminSession();

  const parsedInput = announcementStatusToggleSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  await toggleAnnouncementStatus(parsedInput.id, parsedInput.status);
  refreshShellContent();
  revalidatePath("/admin/announcements");
  redirect(
    `/admin/announcements?notice=${encodeURIComponent(
      parsedInput.status === "ACTIVE" ? "公告已启用" : "公告已停用",
    )}`,
  );
}

const announcementPinToggleSchema = z.object({
  id: z.string().min(1, "公告 ID 缺失"),
  isPinned: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function toggleAnnouncementPinAction(formData: FormData) {
  await requireAdminSession();

  const parsedInput = announcementPinToggleSchema.parse({
    id: formData.get("id"),
    isPinned: formData.get("isPinned"),
  });

  await toggleAnnouncementPin(parsedInput.id, parsedInput.isPinned);
  refreshShellContent();
  revalidatePath("/admin/announcements");
  redirect(
    `/admin/announcements?notice=${encodeURIComponent(
      parsedInput.isPinned ? "公告已置顶" : "公告已取消置顶",
    )}`,
  );
}
