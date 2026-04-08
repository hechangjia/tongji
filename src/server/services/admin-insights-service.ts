import { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildSuggestedDailyTarget,
} from "@/server/services/daily-target-service";
import {
  getTodaySaleDateValue,
  saleDateToValue,
  saleDateValueToDate,
  type DateValue,
} from "@/server/services/sales-service";

export type AdminInsightReasonTag =
  | "结果下滑"
  | "目标偏差过大"
  | "晚交"
  | "驳回偏多";

export type AdminInsightRecommendedAction =
  | "ADJUST_TARGET"
  | "SEND_REMINDER"
  | "REVIEW_SALES";

export type AdminInsightRiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type AdminInsightMemberCardInput = {
  userId: string;
  userName: string;
  targetId?: string | null;
  targetDate: DateValue;
  targetTotal: number;
  currentTotal: number;
  recentAverageTotal: number;
  recentLateSubmissionCount: number;
  recentRejectedCount: number;
  recentDeclineDelta: number;
};

export type AdminInsightMemberCard = {
  userId: string;
  userName: string;
  targetId: string | null;
  targetDate: DateValue;
  targetTotal: number;
  currentTotal: number;
  riskScore: number;
  riskLevel: AdminInsightRiskLevel;
  reasonTags: AdminInsightReasonTag[];
  recommendedActions: AdminInsightRecommendedAction[];
  targetGap: number;
};

export type AdminInsightsOverview = {
  highRiskCount: number;
  mediumRiskCount: number;
  targetCompletionRate: number;
  remindersSentCount: number;
};

export type AdminInsightsDistributionRow = {
  label: AdminInsightReasonTag;
  count: number;
};

export type AdminInsightsData = {
  overview: AdminInsightsOverview;
  anomalyDistribution: AdminInsightsDistributionRow[];
  memberCards: AdminInsightMemberCard[];
  processedCards: AdminInsightMemberCard[];
};

function addDays(dateValue: DateValue, delta: number): DateValue {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));

  return date.toISOString().slice(0, 10) as DateValue;
}

function getRecordTotal(record: { count40: number; count60: number }) {
  return record.count40 + record.count60;
}

export function buildAdminInsightMemberCard(
  input: AdminInsightMemberCardInput,
): AdminInsightMemberCard {
  const reasonTags: AdminInsightReasonTag[] = [];
  const recommendedActions = new Set<AdminInsightRecommendedAction>();
  const targetGap = Math.max(0, input.targetTotal - input.currentTotal);
  let riskScore = 0;

  if (input.recentDeclineDelta >= 3 || input.currentTotal <= input.recentAverageTotal - 3) {
    riskScore += 2;
    reasonTags.push("结果下滑");
    recommendedActions.add("SEND_REMINDER");
  }

  if (targetGap >= 3 || (input.targetTotal > 0 && input.currentTotal / input.targetTotal <= 0.5)) {
    riskScore += 2;
    reasonTags.push("目标偏差过大");
    recommendedActions.add("ADJUST_TARGET");
    recommendedActions.add("SEND_REMINDER");
  }

  if (input.recentLateSubmissionCount > 0) {
    riskScore += 1;
    reasonTags.push("晚交");
    recommendedActions.add("SEND_REMINDER");
  }

  if (input.recentRejectedCount > 0) {
    riskScore += 1;
    reasonTags.push("驳回偏多");
    recommendedActions.add("REVIEW_SALES");
  }

  const riskLevel: AdminInsightRiskLevel =
    riskScore >= 4 ? "HIGH" : riskScore >= 2 ? "MEDIUM" : "LOW";

  return {
    userId: input.userId,
    userName: input.userName,
    targetId: input.targetId ?? null,
    targetDate: input.targetDate,
    targetTotal: input.targetTotal,
    currentTotal: input.currentTotal,
    riskScore,
    riskLevel,
    reasonTags,
    recommendedActions: Array.from(recommendedActions),
    targetGap,
  };
}

function buildAnomalyDistribution(cards: AdminInsightMemberCard[]): AdminInsightsDistributionRow[] {
  const counts = new Map<AdminInsightReasonTag, number>();

  for (const card of cards) {
    for (const tag of card.reasonTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "zh-CN"));
}

function buildOverview(cards: AdminInsightMemberCard[], remindersSentCount: number): AdminInsightsOverview {
  const highRiskCount = cards.filter((card) => card.riskLevel === "HIGH").length;
  const mediumRiskCount = cards.filter((card) => card.riskLevel === "MEDIUM").length;
  const totalTarget = cards.reduce((sum, card) => sum + (card.targetGap + Math.max(0, card.targetGap === 0 ? 0 : card.targetGap ? card.targetGap : 0)), 0);
  const achieved = cards.reduce((sum, card) => sum + Math.max(0, card.targetGap), 0);
  const targetCompletionRate =
    totalTarget === 0 ? 0 : Math.max(0, Math.round(((totalTarget - achieved) / totalTarget) * 100));

  return {
    highRiskCount,
    mediumRiskCount,
    targetCompletionRate,
    remindersSentCount,
  };
}

function resolveTodayTargetForMember(
  user: {
    id: string;
    salesRecords: Array<{
      saleDate: Date;
      count40: number;
      count60: number;
      reviewStatus: string;
    }>;
    dailyTargets: Array<{
      id: string;
      suggestedTotal: number;
      finalTotal: number;
      suggestionReason: string;
    }>;
  },
  todaySaleDate: DateValue,
) {
  const existingTarget = user.dailyTargets[0];

  if (existingTarget) {
    return existingTarget;
  }

  const todayRecord = user.salesRecords.find(
    (record) => saleDateToValue(record.saleDate) === todaySaleDate,
  );
  const historyRecords = user.salesRecords.filter(
    (record) => saleDateToValue(record.saleDate) !== todaySaleDate,
  );
  const recentAverageTotal =
    historyRecords.length === 0
      ? getRecordTotal(todayRecord ?? { count40: 0, count60: 0 })
      : historyRecords.reduce((sum, record) => sum + getRecordTotal(record), 0) / historyRecords.length;
  const recentRejectedCount = historyRecords.filter(
    (record) => record.reviewStatus === "REJECTED",
  ).length;
  const suggestion = buildSuggestedDailyTarget({
    recentAverageTotal,
    recentLateSubmissionCount: 0,
    recentRejectedCount,
  });

  return {
    id: null,
    finalTotal: suggestion.suggestedTotal,
    suggestedTotal: suggestion.suggestedTotal,
    suggestionReason: suggestion.suggestionReason,
  };
}

export async function getAdminInsightsData({
  todaySaleDate,
  now = new Date(),
}: {
  todaySaleDate?: DateValue;
  now?: Date;
} = {}): Promise<AdminInsightsData> {
  const resolvedTodaySaleDate = todaySaleDate ?? getTodaySaleDateValue(now);
  const recentStartDate = addDays(resolvedTodaySaleDate, -6);
  const resolvedTodayDate = saleDateValueToDate(resolvedTodaySaleDate);
  const recentStart = saleDateValueToDate(recentStartDate);
  const todayStart = new Date(`${resolvedTodaySaleDate}T00:00:00.000Z`);
  const nextDayStart = new Date(`${addDays(resolvedTodaySaleDate, 1)}T00:00:00.000Z`);

  const [users, remindersSentCount] = await Promise.all([
    db.user.findMany({
      where: {
        role: Role.MEMBER,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        username: true,
        name: true,
        salesRecords: {
          where: {
            saleDate: {
              gte: recentStart,
              lte: resolvedTodayDate,
            },
          },
          select: {
            saleDate: true,
            count40: true,
            count60: true,
            reviewStatus: true,
          },
          orderBy: [{ saleDate: "desc" }],
        },
        dailyTargets: {
          where: {
            targetDate: resolvedTodayDate,
          },
          select: {
            id: true,
            suggestedTotal: true,
            finalTotal: true,
            suggestionReason: true,
          },
          take: 1,
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
    }),
    db.memberReminder.count({
      where: {
        sentAt: {
          gte: todayStart,
          lt: nextDayStart,
        },
      },
    }),
  ]);
  const memberCards = users
    .map((user) => {
      const resolvedTarget = resolveTodayTargetForMember(user, resolvedTodaySaleDate);
      const todayRecord = user.salesRecords.find(
        (record) => saleDateToValue(record.saleDate) === resolvedTodaySaleDate,
      );
      const historyRecords = user.salesRecords.filter(
        (record) => saleDateToValue(record.saleDate) !== resolvedTodaySaleDate,
      );
      const recentAverageTotal =
        historyRecords.length === 0
          ? getRecordTotal(todayRecord ?? { count40: 0, count60: 0 })
          : historyRecords.reduce((sum, record) => sum + getRecordTotal(record), 0) / historyRecords.length;
      const recentRejectedCount = historyRecords.filter(
        (record) => record.reviewStatus === "REJECTED",
      ).length;
      const currentTotal = todayRecord ? getRecordTotal(todayRecord) : 0;

      return buildAdminInsightMemberCard({
        userId: user.id,
        userName: user.name || user.username,
        targetId: resolvedTarget.id ?? null,
        targetDate: resolvedTodaySaleDate,
        targetTotal: resolvedTarget.finalTotal,
        currentTotal,
        recentAverageTotal,
        recentLateSubmissionCount: 0,
        recentRejectedCount,
        recentDeclineDelta: Math.max(0, Math.round(recentAverageTotal - currentTotal)),
      });
    })
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      return left.userName.localeCompare(right.userName, "zh-CN");
    });

  return {
    overview: buildOverview(memberCards, remindersSentCount),
    anomalyDistribution: buildAnomalyDistribution(memberCards),
    memberCards,
    processedCards: [],
  };
}
