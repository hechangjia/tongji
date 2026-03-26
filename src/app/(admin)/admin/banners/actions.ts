"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import {
  createBannerQuote,
  toggleBannerQuoteStatus,
  updateBannerSettings,
} from "@/server/services/banner-service";
import { fetchHitokotoBannerDraft } from "@/server/services/hitokoto-service";
import {
  bannerQuoteSchema,
  bannerSettingsSchema,
} from "@/lib/validators/banner";
import type {
  BannerQuoteFormState,
  BannerSettingsFormState,
} from "@/app/(admin)/admin/banners/form-state";

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fbanners");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function createBannerQuoteAction(
  _previousState: unknown,
  formData: FormData,
): Promise<BannerQuoteFormState> {
  await requireAdminSession();

  const rawValues = {
    content: String(formData.get("content") ?? ""),
    author: String(formData.get("author") ?? ""),
    sourceType: "CUSTOM" as const,
    status:
      formData.get("status") === "INACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const),
  };
  const parsedInput = bannerQuoteSchema.safeParse(rawValues);

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.content?.[0] ??
        fieldErrors.author?.[0] ??
        fieldErrors.status?.[0] ??
        "请检查横幅内容",
      values: {
        content: rawValues.content,
        author: rawValues.author,
        status: rawValues.status,
      },
    };
  }

  await createBannerQuote(parsedInput.data);
  revalidatePath("/admin/banners");

  return {
    status: "success",
    message: "横幅已保存",
    values: {
      content: "",
      author: "",
      status: "ACTIVE",
    },
  };
}

export async function updateBannerSettingsAction(
  _previousState: unknown,
  formData: FormData,
): Promise<BannerSettingsFormState> {
  await requireAdminSession();

  const rawValues = {
    displayMode:
      formData.get("displayMode") === "ROTATE" ? ("ROTATE" as const) : ("RANDOM" as const),
    isEnabled: formData.get("isEnabled") === "on" ? "true" : "false",
  };
  const parsedInput = bannerSettingsSchema.safeParse(rawValues);

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.displayMode?.[0] ??
        fieldErrors.isEnabled?.[0] ??
        "请检查展示设置",
      values: {
        displayMode: rawValues.displayMode,
        isEnabled: rawValues.isEnabled === "true",
      },
    };
  }

  await updateBannerSettings(parsedInput.data);
  revalidatePath("/admin/banners");

  return {
    status: "success",
    message: "展示设置已更新",
    values: parsedInput.data,
  };
}

const bannerStatusToggleSchema = z.object({
  id: z.string().min(1, "横幅 ID 缺失"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function toggleBannerQuoteStatusAction(formData: FormData) {
  await requireAdminSession();

  const parsedInput = bannerStatusToggleSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  await toggleBannerQuoteStatus(parsedInput.id, parsedInput.status);
  revalidatePath("/admin/banners");
  redirect(
    `/admin/banners?notice=${encodeURIComponent(
      parsedInput.status === "ACTIVE" ? "横幅已启用" : "横幅已停用",
    )}`,
  );
}

export async function importHitokotoBannerAction() {
  await requireAdminSession();

  try {
    const draft = await fetchHitokotoBannerDraft();
    await createBannerQuote(draft);
    revalidatePath("/admin/banners");
    redirect(
      `/admin/banners?notice=${encodeURIComponent(
        "已从 hitokoto 导入一条文案，默认停用，请确认后启用",
      )}`,
    );
  } catch {
    redirect(
      `/admin/banners?notice=${encodeURIComponent(
        "hitokoto 导入失败，请稍后重试",
      )}`,
    );
  }
}
