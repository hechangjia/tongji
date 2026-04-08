import { db } from "@/lib/db";
import {
  getTodaySaleDateValue,
  saleDateToValue,
  saleDateValueToDate,
  type DateValue,
} from "@/server/services/sales-service";

export type TargetSuggestionInput = {
  recentAverageTotal: number;
  recentLateSubmissionCount: number;
  recentRejectedCount: number;
};

export type MemberDailyTargetFeedback = {
  targetTotal: number;
  currentTotal: number;
  gap: number;
  completionRate: number;
  status: "AHEAD" | "ON_TRACK" | "BEHIND" | "NO_TARGET";
};

export type MemberSelfTrendSummary = {
  direction: "UP" | "FLAT" | "DOWN";
  label: string;
  message: string;
};

type TargetSuggestionSourceRecord = {
  saleDate: Date;
  count40: number;
  count60: number;
  reviewStatus: string;
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

export async function upsertFinalDailyTargetForUser(input: {
  userId: string;
  targetDate: DateValue;
  finalTotal: number;
  adjustedById: string;
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
      finalTotal: input.finalTotal,
      adjustedById: input.adjustedById,
      adjustedAt: new Date(),
    },
    create: {
      userId: input.userId,
      targetDate,
      suggestedTotal: input.finalTotal,
      finalTotal: input.finalTotal,
      suggestionReason: "管理员从经营诊断页手动设置",
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

function getRecordTotal(record: { count40: number; count60: number }) {
  return record.count40 + record.count60;
}

function buildTargetSuggestionFromRecentRecords(
  records: TargetSuggestionSourceRecord[],
  todaySaleDate: DateValue,
) {
  const todayRecord = records.find((record) => saleDateToValue(record.saleDate) === todaySaleDate);
  const historyRecords = records.filter((record) => saleDateToValue(record.saleDate) !== todaySaleDate);
  const recentAverageTotal =
    historyRecords.length === 0
      ? getRecordTotal(todayRecord ?? { count40: 0, count60: 0 })
      : historyRecords.reduce((sum, record) => sum + getRecordTotal(record), 0) / historyRecords.length;
  const recentRejectedCount = historyRecords.filter(
    (record) => record.reviewStatus === "REJECTED",
  ).length;

  return buildSuggestedDailyTarget({
    recentAverageTotal,
    recentLateSubmissionCount: 0,
    recentRejectedCount,
  });
}

export async function ensureDailyTargetForUser(input: {
  userId: string;
  todaySaleDate: DateValue;
  recentRecords?: TargetSuggestionSourceRecord[];
}) {
  const targetDate = saleDateValueToDate(input.todaySaleDate);
  const existingTarget = await db.dailyTarget.findUnique({
    where: {
      userId_targetDate: {
        userId: input.userId,
        targetDate,
      },
    },
  });

  if (existingTarget) {
    return existingTarget;
  }

  const recentRecords =
    input.recentRecords ??
    (await db.salesRecord.findMany({
      where: {
        userId: input.userId,
        saleDate: {
          lte: targetDate,
        },
      },
      select: {
        saleDate: true,
        count40: true,
        count60: true,
        reviewStatus: true,
      },
      orderBy: [{ saleDate: "desc" }],
      take: 7,
    }));

  const suggestion = buildTargetSuggestionFromRecentRecords(recentRecords, input.todaySaleDate);

  return upsertDailyTargetForUser({
    userId: input.userId,
    targetDate: input.todaySaleDate,
    suggestedTotal: suggestion.suggestedTotal,
    suggestionReason: suggestion.suggestionReason,
  });
}

export async function getMemberDailyTargetFeedback(input: {
  userId: string;
  todaySaleDate?: DateValue;
}): Promise<MemberDailyTargetFeedback> {
  const todaySaleDate = input.todaySaleDate ?? getTodaySaleValue();
  const targetDate = saleDateValueToDate(todaySaleDate);
  const [target, records] = await Promise.all([
    db.dailyTarget.findUnique({
      where: {
        userId_targetDate: {
          userId: input.userId,
          targetDate,
        },
      },
    }),
    db.salesRecord.findMany({
      where: {
        userId: input.userId,
        saleDate: {
          lte: targetDate,
        },
      },
      select: {
        saleDate: true,
        count40: true,
        count60: true,
        reviewStatus: true,
      },
      orderBy: [{ saleDate: "desc" }],
      take: 7,
    }),
  ]);
  const todayRecord = records.find((record) => saleDateToValue(record.saleDate) === todaySaleDate);
  const resolvedTarget =
    target ?? {
      id: null,
      finalTotal: buildTargetSuggestionFromRecentRecords(records, todaySaleDate).suggestedTotal,
    };

  const targetTotal = resolvedTarget.finalTotal ?? 0;
  const currentTotal = todayRecord ? getRecordTotal(todayRecord) : 0;
  const gap = Math.max(0, targetTotal - currentTotal);
  const completionRate = targetTotal === 0 ? 0 : Math.round((currentTotal / targetTotal) * 100);

  return {
    targetTotal,
    currentTotal,
    gap,
    completionRate,
    status:
      targetTotal === 0
        ? "NO_TARGET"
        : gap === 0
          ? "ON_TRACK"
          : currentTotal > targetTotal
            ? "AHEAD"
            : "BEHIND",
  };
}

export async function getMemberSelfTrendSummary(input: {
  userId: string;
  todaySaleDate?: DateValue;
}): Promise<MemberSelfTrendSummary> {
  const todaySaleDate = input.todaySaleDate ?? getTodaySaleValue();
  const todayDate = saleDateValueToDate(todaySaleDate);
  const records = await db.salesRecord.findMany({
    where: {
      userId: input.userId,
      saleDate: {
        lte: todayDate,
      },
    },
    orderBy: [{ saleDate: "desc" }],
    take: 7,
  });

  const [todayRecord, ...history] = records;
  const currentTotal = todayRecord ? getRecordTotal(todayRecord) : 0;
  const baseline =
    history.length === 0 ? currentTotal : history.reduce((sum, record) => sum + getRecordTotal(record), 0) / history.length;

  if (currentTotal >= baseline + 2) {
    return {
      direction: "UP",
      label: "高于近 7 天常态",
      message: "今天的完成度高于你最近几天的平均水平。",
    };
  }

  if (currentTotal <= baseline - 2) {
    return {
      direction: "DOWN",
      label: "低于近 7 天常态",
      message: "今天的完成度低于你最近几天的平均水平。",
    };
  }

  return {
    direction: "FLAT",
    label: "接近近 7 天常态",
    message: "今天的完成度与最近几天的平均水平接近。",
  };
}

function getTodaySaleValue() {
  return getTodaySaleDateValue();
}
