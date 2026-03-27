import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import {
  getAdminCumulativeTrend,
  getMemberCumulativeRanking,
} from "@/server/services/cumulative-sales-stats-service";
import {
  getAdminDailyRhythmSummary,
  getDailyTop3Status,
  type DailyTop3StatusInput,
  getMemberDailyRhythmSummary,
} from "@/server/services/daily-rhythm-service";
import {
  getDailyLeaderboard,
  getRangeLeaderboard,
} from "@/server/services/leaderboard-service";
import type { DateValue } from "@/server/services/sales-service";

export const LEADERBOARD_CACHE_TAG = "leaderboard";
export const LEADERBOARD_CACHE_REVALIDATE_SECONDS = 30;

const cachedDailyLeaderboard = unstable_cache(
  async (date: DateValue) => getDailyLeaderboard(date),
  ["leaderboard-daily"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedRangeLeaderboard = unstable_cache(
  async (startDate: DateValue, endDate: DateValue) =>
    getRangeLeaderboard(startDate, endDate),
  ["leaderboard-range"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedMemberCumulativeRanking = unstable_cache(
  async (input: {
    startDate: DateValue;
    endDate: DateValue;
    currentUserId: string;
  }) => getMemberCumulativeRanking(input),
  ["leaderboard-member-cumulative-ranking"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedAdminCumulativeTrend = unstable_cache(
  async (input: {
    preset: "MONTH" | "ROLLING_30" | "ALL_TIME";
    metric: "TOTAL" | "PLAN_40" | "PLAN_60";
  }) => getAdminCumulativeTrend(input),
  ["leaderboard-admin-cumulative-trend"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedMemberDailyRhythmSummary = unstable_cache(
  async (input: {
    currentUserId: string;
    todaySaleDate?: DateValue;
  }) => getMemberDailyRhythmSummary(input),
  ["leaderboard-member-daily-rhythm-summary"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedAdminDailyRhythmSummary = unstable_cache(
  async (input: {
    todaySaleDate?: DateValue;
  }) => getAdminDailyRhythmSummary(input),
  ["leaderboard-admin-daily-rhythm-summary"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedDailyTop3Status = unstable_cache(
  async (input: DailyTop3StatusInput) => getDailyTop3Status(input),
  ["leaderboard-daily-top3-status"],
  {
    tags: [LEADERBOARD_CACHE_TAG],
    revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  },
);

export function getCachedDailyLeaderboard(date: DateValue) {
  return cachedDailyLeaderboard(date);
}

export function getCachedRangeLeaderboard(startDate: DateValue, endDate: DateValue) {
  return cachedRangeLeaderboard(startDate, endDate);
}

export function getCachedMemberCumulativeRanking(input: {
  startDate: DateValue;
  endDate: DateValue;
  currentUserId: string;
}) {
  return cachedMemberCumulativeRanking(input);
}

export function getCachedAdminCumulativeTrend(input: {
  preset: "MONTH" | "ROLLING_30" | "ALL_TIME";
  metric: "TOTAL" | "PLAN_40" | "PLAN_60";
}) {
  return cachedAdminCumulativeTrend(input);
}

export function getCachedMemberDailyRhythmSummary(input: {
  currentUserId: string;
  todaySaleDate?: DateValue;
}) {
  return cachedMemberDailyRhythmSummary(input);
}

export function getCachedAdminDailyRhythmSummary(input: {
  todaySaleDate?: DateValue;
}) {
  return cachedAdminDailyRhythmSummary(input);
}

export function getCachedDailyTop3Status(input: DailyTop3StatusInput) {
  return cachedDailyTop3Status(input);
}

export function refreshLeaderboardCaches() {
  updateTag(LEADERBOARD_CACHE_TAG);
  revalidatePath("/entry");
  revalidatePath("/leaderboard/daily");
  revalidatePath("/leaderboard/range");
  revalidatePath("/admin");
}
