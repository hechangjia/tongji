import { db } from "@/lib/db";
import { saleDateValueToDate, type DateValue } from "@/server/services/sales-service";

export type TargetSuggestionInput = {
  recentAverageTotal: number;
  recentLateSubmissionCount: number;
  recentRejectedCount: number;
};

export function buildSuggestedDailyTarget(input: TargetSuggestionInput) {
  const baseline = Math.round(input.recentAverageTotal);
  const penalty = Math.min(2, input.recentLateSubmissionCount + input.recentRejectedCount);
  const suggestedTotal = Math.max(0, baseline - penalty);
  const reasons = [`近 7 天平均约 ${baseline} 单`];

  if (penalty > 0) {
    reasons.push("最近状态存在波动，建议目标适度保守");
  } else {
    reasons.push("最近状态稳定，可按近期常态推进");
  }

  return {
    suggestedTotal,
    suggestionReason: reasons.join("，"),
  };
}

export async function upsertDailyTargetForUser(input: {
  userId: string;
  targetDate: DateValue;
  suggestedTotal: number;
  suggestionReason: string;
}) {
  const targetDate = saleDateValueToDate(input.targetDate);

  return db.dailyTarget.upsert({
    where: {
      userId_targetDate: {
        userId: input.userId,
        targetDate,
      },
    },
    update: {
      suggestedTotal: input.suggestedTotal,
      suggestionReason: input.suggestionReason,
    },
    create: {
      userId: input.userId,
      targetDate,
      suggestedTotal: input.suggestedTotal,
      finalTotal: input.suggestedTotal,
      suggestionReason: input.suggestionReason,
    },
  });
}

export async function updateFinalDailyTarget(input: {
  targetId: string;
  finalTotal: number;
  adjustedById: string;
}) {
  return db.dailyTarget.update({
    where: { id: input.targetId },
    data: {
      finalTotal: input.finalTotal,
      adjustedById: input.adjustedById,
      adjustedAt: new Date(),
    },
  });
}

export async function listDailyTargetsForDate(targetDate: DateValue) {
  return db.dailyTarget.findMany({
    where: {
      targetDate: saleDateValueToDate(targetDate),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          status: true,
          role: true,
        },
      },
      adjustedBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: [{ finalTotal: "desc" }, { updatedAt: "desc" }],
  });
}
