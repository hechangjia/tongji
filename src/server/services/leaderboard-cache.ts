import { revalidatePath, unstable_cache, updateTag } from "next/cache";
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

export function getCachedDailyLeaderboard(date: DateValue) {
  return cachedDailyLeaderboard(date);
}

export function getCachedRangeLeaderboard(startDate: DateValue, endDate: DateValue) {
  return cachedRangeLeaderboard(startDate, endDate);
}

export function refreshLeaderboardCaches() {
  updateTag(LEADERBOARD_CACHE_TAG);
  revalidatePath("/leaderboard/daily");
  revalidatePath("/leaderboard/range");
}
