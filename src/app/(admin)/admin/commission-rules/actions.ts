"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createCommissionRule } from "@/server/services/commission-service";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { commissionRuleSchema } from "@/lib/validators/commission";
import type { CommissionRuleFormState } from "@/app/(admin)/admin/commission-rules/form-state";

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fcommission-rules");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function createCommissionRuleAction(
  _previousState: unknown,
  formData: FormData,
): Promise<CommissionRuleFormState> {
  await requireAdminSession();

  const rawValues = {
    userId: String(formData.get("userId") ?? ""),
    price40: String(formData.get("price40") ?? ""),
    price60: String(formData.get("price60") ?? ""),
    effectiveStart: String(formData.get("effectiveStart") ?? ""),
    effectiveEnd: String(formData.get("effectiveEnd") ?? ""),
  };
  const parsedInput = commissionRuleSchema.safeParse(rawValues);

  if (!parsedInput.success) {
    const fieldErrors = parsedInput.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        fieldErrors.userId?.[0] ??
        fieldErrors.price40?.[0] ??
        fieldErrors.price60?.[0] ??
        fieldErrors.effectiveStart?.[0] ??
        fieldErrors.effectiveEnd?.[0] ??
        "请检查卡酬规则信息",
      values: rawValues,
    };
  }

  try {
    await createCommissionRule(parsedInput.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "保存卡酬规则失败",
      values: rawValues,
    };
  }

  revalidatePath("/admin/commission-rules");

  return {
    status: "success",
    message: "卡酬规则已保存",
    values: {
      userId: "",
      price40: "",
      price60: "",
      effectiveStart: "",
      effectiveEnd: "",
    },
  };
}
