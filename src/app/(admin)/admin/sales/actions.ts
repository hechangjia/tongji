"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { refreshLeaderboardCaches } from "@/server/services/leaderboard-cache";
import { salesRecordUpdateSchema, salesReviewActionSchema } from "@/lib/validators/sales";

function appendNotice(returnTo: string, notice: string) {
  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}notice=${encodeURIComponent(notice)}`;
}

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fsales%3Fscope%3Dtoday");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function updateSalesRecordAction(formData: FormData) {
  await requireAdminSession();

  const parsedInput = salesRecordUpdateSchema.parse({
    id: formData.get("id"),
    count40: formData.get("count40"),
    count60: formData.get("count60"),
    remark: formData.get("remark"),
    returnTo: formData.get("returnTo"),
  });

  await db.salesRecord.update({
    where: { id: parsedInput.id },
    data: {
      count40: parsedInput.count40,
      count60: parsedInput.count60,
      remark: parsedInput.remark,
    },
  });

  revalidatePath("/admin/sales");
  refreshLeaderboardCaches();
  redirect(appendNotice(parsedInput.returnTo, "销售记录已更新"));
}

export async function reviewSalesRecordAction(
  decision: "APPROVED" | "REJECTED",
  formData: FormData,
) {
  await requireAdminSession();

  const parsedInput = salesReviewActionSchema.parse({
    id: formData.get("id"),
    decision,
    reviewNote: formData.get("reviewNote"),
    returnTo: formData.get("returnTo"),
  });

  await db.salesRecord.update({
    where: { id: parsedInput.id },
    data: {
      reviewStatus: parsedInput.decision,
      reviewedAt: new Date(),
      reviewNote: parsedInput.decision === "REJECTED" ? parsedInput.reviewNote || null : null,
    },
  });

  revalidatePath("/admin/sales");
  refreshLeaderboardCaches();
  redirect(
    appendNotice(parsedInput.returnTo, parsedInput.decision === "APPROVED" ? "审核已通过" : "审核已驳回"),
  );
}
