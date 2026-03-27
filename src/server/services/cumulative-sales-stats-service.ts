import { db } from "@/lib/db";
import {
  getTodaySaleDateValue,
  saleDateToValue,
  saleDateValueToDate,
  type DateValue,
} from "@/server/services/sales-service";

export type CumulativePreset = "MONTH" | "ROLLING_30" | "ALL_TIME";
export type CumulativeMetric = "TOTAL" | "PLAN_40" | "PLAN_60";
export type TrendGranularity = "day" | "month";

export type CumulativeSourceRow = {
  userId: string;
  userName: string;
  role: "MEMBER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  saleDate: DateValue;
  count40: number;
  count60: number;
};

export type CumulativeRange = {
  startDate: DateValue;
  endDate: DateValue;
  endExclusiveDate: DateValue;
};

export type MemberCumulativeRow = {
  rank: number;
  userName: string;
  total: number;
  isCurrentUser: boolean;
  isMyPositionRow?: boolean;
  gapToPrevious?: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type TrendSeriesRow = {
  userId: string;
  userName: string;
  total: number;
  points: TrendPoint[];
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function addDays(dateValue: DateValue, delta: number): DateValue {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as DateValue;
}

function diffDays(range: CumulativeRange) {
  return Math.round(
    (saleDateValueToDate(range.endExclusiveDate).getTime() -
      saleDateValueToDate(range.startDate).getTime()) /
      86_400_000,
  );
}

function resolveMetricValue(row: Pick<CumulativeSourceRow, "count40" | "count60">, metric: CumulativeMetric) {
  if (metric === "PLAN_40") {
    return row.count40;
  }

  if (metric === "PLAN_60") {
    return row.count60;
  }

  return row.count40 + row.count60;
}

function isVisibleMemberRow(row: CumulativeSourceRow) {
  return row.role === "MEMBER" && row.status === "ACTIVE";
}

function toMonthKey(dateValue: DateValue) {
  return dateValue.slice(0, 7);
}

function buildDayLabels(range: CumulativeRange) {
  const labels: DateValue[] = [];
  let current = range.startDate;

  while (current !== range.endExclusiveDate) {
    labels.push(current);
    current = addDays(current, 1);
  }

  return labels;
}

function buildMonthLabels(range: CumulativeRange) {
  const labels = new Set<string>();

  for (const day of buildDayLabels(range)) {
    labels.add(toMonthKey(day));
  }

  return Array.from(labels.values());
}

function normalizeRows(rows: CumulativeSourceRow[]) {
  return rows.filter(isVisibleMemberRow);
}

export function resolvePresetRange(
  preset: Exclude<CumulativePreset, "ALL_TIME">,
  now = new Date(),
): CumulativeRange {
  const endDate = getTodaySaleDateValue(now);
  const [year, month] = endDate.split("-").map(Number);

  if (preset === "MONTH") {
    return {
      startDate: `${year}-${pad(month)}-01` as DateValue,
      endDate,
      endExclusiveDate: addDays(endDate, 1),
    };
  }

  return {
    startDate: addDays(endDate, -29),
    endDate,
    endExclusiveDate: addDays(endDate, 1),
  };
}

export function resolveTrendGranularity(range: CumulativeRange): TrendGranularity {
  return diffDays(range) > 180 ? "month" : "day";
}

export function buildMemberCumulativeRanking({
  rows,
  currentUserId,
  metric,
  topLimit,
}: {
  rows: CumulativeSourceRow[];
  currentUserId: string;
  metric: CumulativeMetric;
  topLimit: number;
}): MemberCumulativeRow[] {
  const totals = new Map<
    string,
    {
      userName: string;
      total: number;
    }
  >();

  for (const row of normalizeRows(rows)) {
    const current = totals.get(row.userId);
    const value = resolveMetricValue(row, metric);

    if (current) {
      current.total += value;
      continue;
    }

    totals.set(row.userId, {
      userName: row.userName,
      total: value,
    });
  }

  const ranked = Array.from(totals.entries())
    .map(([userId, value]) => ({
      userId,
      userName: value.userName,
      total: value.total,
    }))
    .sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total;
      }

      return left.userName.localeCompare(right.userName, "zh-CN");
    })
    .map((row, index, source) => ({
      rank: index + 1,
      userId: row.userId,
      userName: row.userName,
      total: row.total,
      isCurrentUser: row.userId === currentUserId,
      gapToPrevious: index > 0 ? source[index - 1].total - row.total : undefined,
    }));

  if (ranked.length <= topLimit) {
    return ranked.map((row) => ({
      rank: row.rank,
      userName: row.userName,
      total: row.total,
      isCurrentUser: row.isCurrentUser,
      gapToPrevious: row.gapToPrevious,
    }));
  }

  const topRows: MemberCumulativeRow[] = ranked.slice(0, topLimit).map((row) => ({
    rank: row.rank,
    userName: row.userName,
    total: row.total,
    isCurrentUser: row.isCurrentUser,
    gapToPrevious: row.gapToPrevious,
  }));
  const currentUserRow = ranked.find((row) => row.userId === currentUserId);

  if (!currentUserRow || currentUserRow.rank <= topLimit) {
    return topRows;
  }

  return topRows.concat({
    rank: currentUserRow.rank,
    userName: currentUserRow.userName,
    total: currentUserRow.total,
    isCurrentUser: true,
    isMyPositionRow: true,
    gapToPrevious: currentUserRow.gapToPrevious,
  });
}

export function buildTrendSeries({
  rows,
  metric,
  topLimit,
  granularity,
  range,
}: {
  rows: CumulativeSourceRow[];
  metric: CumulativeMetric;
  topLimit: number;
  granularity: TrendGranularity;
  range: CumulativeRange;
}): TrendSeriesRow[] {
  const visibleRows = normalizeRows(rows);
  const totals = new Map<
    string,
    {
      userName: string;
      total: number;
    }
  >();

  for (const row of visibleRows) {
    const current = totals.get(row.userId);
    const value = resolveMetricValue(row, metric);

    if (current) {
      current.total += value;
      continue;
    }

    totals.set(row.userId, {
      userName: row.userName,
      total: value,
    });
  }

  const selected = Array.from(totals.entries())
    .map(([userId, value]) => ({
      userId,
      userName: value.userName,
      total: value.total,
    }))
    .sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total;
      }

      return left.userName.localeCompare(right.userName, "zh-CN");
    })
    .slice(0, topLimit);

  const labels = granularity === "day" ? buildDayLabels(range) : buildMonthLabels(range);

  return selected.map((user) => {
    const grouped = new Map<string, number>();

    for (const row of visibleRows) {
      if (row.userId !== user.userId) {
        continue;
      }

      const key = granularity === "day" ? row.saleDate : toMonthKey(row.saleDate);
      grouped.set(key, (grouped.get(key) ?? 0) + resolveMetricValue(row, metric));
    }

    let runningTotal = 0;
    const points = labels.map((label) => {
      runningTotal += grouped.get(label) ?? 0;

      return {
        label,
        value: runningTotal,
      };
    });

    return {
      userId: user.userId,
      userName: user.userName,
      total: user.total,
      points,
    };
  });
}

type MemberRankingInput = {
  startDate: DateValue;
  endDate: DateValue;
  currentUserId: string;
  metric?: CumulativeMetric;
  topLimit?: number;
};

export async function getMemberCumulativeRanking({
  startDate,
  endDate,
  currentUserId,
  metric = "TOTAL",
  topLimit = 10,
}: MemberRankingInput) {
  const endExclusiveDate = addDays(endDate, 1);
  const rows = await db.salesRecord.findMany({
    where: {
      saleDate: {
        gte: saleDateValueToDate(startDate),
        lt: saleDateValueToDate(endExclusiveDate),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return buildMemberCumulativeRanking({
    rows: rows.map((row) => ({
      userId: row.user.id,
      userName: row.user.name || row.user.username,
      role: row.user.role,
      status: row.user.status,
      saleDate: saleDateToValue(row.saleDate),
      count40: row.count40,
      count60: row.count60,
    })),
    currentUserId,
    metric,
    topLimit,
  });
}

type AdminTrendInput = {
  preset: CumulativePreset;
  metric?: CumulativeMetric;
  topLimit?: number;
  now?: Date;
};

export async function getAdminCumulativeTrend({
  preset,
  metric = "TOTAL",
  topLimit = 5,
  now = new Date(),
}: AdminTrendInput) {
  let range: CumulativeRange;

  if (preset === "ALL_TIME") {
    const earliestRecord = await db.salesRecord.findFirst({
      orderBy: {
        saleDate: "asc",
      },
      select: {
        saleDate: true,
      },
    });
    const endDate = getTodaySaleDateValue(now);

    range = {
      startDate: earliestRecord ? saleDateToValue(earliestRecord.saleDate) : endDate,
      endDate,
      endExclusiveDate: addDays(endDate, 1),
    };
  } else {
    range = resolvePresetRange(preset, now);
  }

  const rows = await db.salesRecord.findMany({
    where: {
      saleDate: {
        gte: saleDateValueToDate(range.startDate),
        lt: saleDateValueToDate(range.endExclusiveDate),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true,
        },
      },
    },
  });

  const series = buildTrendSeries({
    rows: rows.map((row) => ({
      userId: row.user.id,
      userName: row.user.name || row.user.username,
      role: row.user.role,
      status: row.user.status,
      saleDate: saleDateToValue(row.saleDate),
      count40: row.count40,
      count60: row.count60,
    })),
    metric,
    topLimit,
    granularity: resolveTrendGranularity(range),
    range,
  });

  return {
    range,
    granularity: resolveTrendGranularity(range),
    series,
  };
}
