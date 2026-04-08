"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { refreshAdminInsightsCache } from "@/server/services/admin-insights-cache";
import { refreshEntryInsightsCache } from "@/server/services/entry-insights-cache";
import { refreshMemberRecordsCache } from "@/server/services/member-records-cache";
import {
  getMemberDailyTargetFeedback,
  getMemberSelfTrendSummary,
} from "@/server/services/daily-target-service";
import { getMemberDailyRhythmSummary } from "@/server/services/daily-rhythm-service";
import {
  refreshLeaderWorkbenchCaches,
  refreshLeaderboardCaches,
} from "@/server/services/leaderboard-cache";
import { getMemberRecentReminders } from "@/server/services/member-reminder-service";
import {
  getMemberIdentifierWorkspace,
  saveIdentifierSaleForUser,
} from "@/server/services/member-identifier-sale-service";
import {
  getTodaySaleDateValue,
  saleDateToValue,
  saveSalesRecordForUser,
} from "@/server/services/sales-service";
import type {
  IdentifierSaleFormState,
  SalesEntryFormState,
} from "@/app/(member)/entry/form-state";

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
    const todaySaleDate = getTodaySaleDateValue();
    const [dailyRhythm, targetFeedback, selfTrend, recentReminders] = await Promise.all([
      getMemberDailyRhythmSummary({
        currentUserId: session.user.id,
        todaySaleDate,
      }),
      getMemberDailyTargetFeedback({
        userId: session.user.id,
        todaySaleDate,
      }),
      getMemberSelfTrendSummary({
        userId: session.user.id,
        todaySaleDate,
      }),
      getMemberRecentReminders(session.user.id),
    ]);
    refreshLeaderboardCaches();
    refreshAdminInsightsCache();
    refreshEntryInsightsCache();
    refreshMemberRecordsCache();

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
        targetFeedback,
        selfTrend,
        recentReminders,
        dailyRhythm: {
          lastSubmittedAtIso:
            saleDate === todaySaleDate
              ? lastSubmittedAt.toISOString()
              : previousState?.summary?.dailyRhythm.lastSubmittedAtIso ?? null,
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

export async function saveIdentifierSaleAction(
  previousState: IdentifierSaleFormState | undefined,
  formData: FormData,
): Promise<IdentifierSaleFormState> {
  const session = await auth();

  if (!session?.user || !canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  const todaySaleDate = getTodaySaleDateValue();
  const fallbackValues = {
    codeId: String(formData.get("codeId") ?? ""),
    planType: formData.get("planType") === "PLAN_60" ? ("PLAN_60" as const) : ("PLAN_40" as const),
    saleDate: String(formData.get("saleDate") ?? todaySaleDate),
    sourceMode:
      formData.get("sourceMode") === "MANUAL_INPUT"
        ? ("MANUAL_INPUT" as const)
        : ("ASSIGNED_LEAD" as const),
    prospectLeadId: String(formData.get("prospectLeadId") ?? ""),
    qqNumber: String(formData.get("qqNumber") ?? ""),
    major: String(formData.get("major") ?? ""),
    remark: String(formData.get("remark") ?? ""),
    followUpItemId: String(formData.get("followUpItemId") ?? ""),
  };

  try {
    const result = await saveIdentifierSaleForUser(session.user.id, {
      codeId: formData.get("codeId"),
      planType: formData.get("planType"),
      saleDate: formData.get("saleDate"),
      sourceMode: formData.get("sourceMode"),
      prospectLeadId: formData.get("prospectLeadId"),
      qqNumber: formData.get("qqNumber"),
      major: formData.get("major"),
      remark: formData.get("remark"),
      followUpItemId: formData.get("followUpItemId"),
    });
    const workspace = await getMemberIdentifierWorkspace({
      userId: session.user.id,
      todaySaleDate,
    });

    refreshLeaderboardCaches();
    refreshLeaderWorkbenchCaches();
    refreshAdminInsightsCache();
    refreshEntryInsightsCache();
    refreshMemberRecordsCache();

    return {
      status: "success",
      message: "识别码成交已保存",
      values: {
        codeId: "",
        planType: "PLAN_40",
        saleDate: fallbackValues.saleDate,
        sourceMode: "ASSIGNED_LEAD",
        prospectLeadId: "",
        qqNumber: "",
        major: "",
        remark: "",
        followUpItemId: "",
      },
      summary: {
        saleId: result.sale.id,
        planType: fallbackValues.planType,
        sourceLabel: result.sourceLabel,
        savedAtIso: result.sale.createdAt.toISOString(),
      },
      workspace,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "识别码成交保存失败，请稍后重试",
      values: fallbackValues,
      summary: previousState?.summary ?? null,
      workspace: previousState?.workspace ?? null,
    };
  }
}
