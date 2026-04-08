"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { refreshAdminInsightsCache } from "@/server/services/admin-insights-cache";
import { refreshEntryInsightsCache } from "@/server/services/entry-insights-cache";
import { refreshLeaderboardCaches } from "@/server/services/leaderboard-cache";
import { dailyTargetAdjustSchema } from "@/lib/validators/target";
import { memberReminderSchema } from "@/lib/validators/reminder";
import {
  updateFinalDailyTarget,
  upsertFinalDailyTargetForUser,
} from "@/server/services/daily-target-service";
import { createMemberReminder } from "@/server/services/member-reminder-service";

function appendNotice(returnTo: string, notice: string) {
  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}notice=${encodeURIComponent(notice)}`;
}

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Finsights");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function adjustDailyTargetAction(formData: FormData) {
  const session = await requireAdminSession();

  const parsedInput = dailyTargetAdjustSchema.parse({
    targetId: formData.get("targetId"),
    userId: formData.get("userId"),
    targetDate: formData.get("targetDate"),
    finalTotal: formData.get("finalTotal"),
    returnTo: formData.get("returnTo"),
  });

  if (parsedInput.targetId) {
    await updateFinalDailyTarget({
      targetId: parsedInput.targetId,
      finalTotal: parsedInput.finalTotal,
      adjustedById: session.user.id,
    });
  } else {
    await upsertFinalDailyTargetForUser({
      userId: parsedInput.userId!,
      targetDate: parsedInput.targetDate! as Parameters<
        typeof upsertFinalDailyTargetForUser
      >[0]["targetDate"],
      finalTotal: parsedInput.finalTotal,
      adjustedById: session.user.id,
    });
  }

  revalidatePath("/admin/insights");
  refreshAdminInsightsCache();
  refreshLeaderboardCaches();
  refreshEntryInsightsCache();
  redirect(appendNotice(parsedInput.returnTo, "今日目标已更新"));
}

export async function sendMemberReminderAction(formData: FormData) {
  const session = await requireAdminSession();

  const parsedInput = memberReminderSchema.parse({
    userId: formData.get("userId"),
    template: formData.get("template"),
    title: formData.get("title"),
    content: formData.get("content"),
    returnTo: formData.get("returnTo"),
  });

  await createMemberReminder({
    userId: parsedInput.userId,
    type: parsedInput.template,
    title: parsedInput.title,
    content: parsedInput.content,
    sentById: session.user.id,
  });

  revalidatePath("/admin/insights");
  refreshAdminInsightsCache();
  refreshLeaderboardCaches();
  refreshEntryInsightsCache();
  redirect(appendNotice(parsedInput.returnTo, "提醒已发送"));
}
