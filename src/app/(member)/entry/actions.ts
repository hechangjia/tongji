"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { getMemberDailyRhythmSummary } from "@/server/services/daily-rhythm-service";
import { refreshLeaderboardCaches } from "@/server/services/leaderboard-cache";
import { saleDateToValue, saveSalesRecordForUser } from "@/server/services/sales-service";
import type { SalesEntryFormState } from "@/app/(member)/entry/form-state";

export async function saveSalesEntryAction(
  previousState: SalesEntryFormState | undefined,
  formData: FormData,
): Promise<SalesEntryFormState> {
  const session = await auth();

  if (!session?.user || !canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  try {
    const { isUpdate, record } = await saveSalesRecordForUser(session.user.id, {
      saleDate: formData.get("saleDate"),
      count40: formData.get("count40"),
      count60: formData.get("count60"),
      remark: formData.get("remark"),
    });
    const lastSubmittedAt = record.lastSubmittedAt ?? record.updatedAt;
    const saleDate = saleDateToValue(record.saleDate);
    const dailyRhythm = await getMemberDailyRhythmSummary({
      currentUserId: session.user.id,
      todaySaleDate: saleDate,
    });

    revalidatePath("/entry");
    refreshLeaderboardCaches();

    return {
      status: "success",
      message: "保存成功",
      values: {
        saleDate: saleDateToValue(record.saleDate),
        count40: String(record.count40),
        count60: String(record.count60),
        remark: record.remark ?? "",
      },
      summary: {
        saleDate,
        count40: record.count40,
        count60: record.count60,
        total: record.count40 + record.count60,
        remark: record.remark ?? "",
        reviewStatus: record.reviewStatus,
        lastSubmittedAtIso: lastSubmittedAt.toISOString(),
        savedAtIso: record.updatedAt.toISOString(),
        isUpdate,
        recoveredFromError: previousState?.status === "error",
        dailyRhythm: {
          lastSubmittedAtIso: lastSubmittedAt.toISOString(),
          ...dailyRhythm,
        },
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: "error",
        message: error.message,
        values: {
          saleDate: String(formData.get("saleDate") ?? ""),
          count40: String(formData.get("count40") ?? "0"),
          count60: String(formData.get("count60") ?? "0"),
          remark: String(formData.get("remark") ?? ""),
        },
        summary: null,
      };
    }

    return {
      status: "error",
      message: "保存失败，请稍后重试",
      values: {
        saleDate: String(formData.get("saleDate") ?? ""),
        count40: String(formData.get("count40") ?? "0"),
        count60: String(formData.get("count60") ?? "0"),
        remark: String(formData.get("remark") ?? ""),
      },
      summary: null,
    };
  }
}
