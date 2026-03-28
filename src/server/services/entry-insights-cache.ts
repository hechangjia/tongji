import { unstable_cache, updateTag } from "next/cache";
import {
  getMemberDailyTargetFeedback,
  getMemberSelfTrendSummary,
  type MemberDailyTargetFeedback,
  type MemberSelfTrendSummary,
} from "@/server/services/daily-target-service";
import {
  getMemberRecentReminders,
  type MemberReminderListItem,
} from "@/server/services/member-reminder-service";
import type { DateValue } from "@/server/services/sales-service";

export const ENTRY_INSIGHTS_CACHE_TAG = "entry-insights";
export const ENTRY_INSIGHTS_CACHE_REVALIDATE_SECONDS = 30;

export type MemberEntryInsights = {
  targetFeedback: MemberDailyTargetFeedback;
  selfTrend: MemberSelfTrendSummary;
  recentReminders: MemberReminderListItem[];
};

const cachedMemberEntryInsights = unstable_cache(
  async (input: {
    userId: string;
    todaySaleDate: DateValue;
  }): Promise<MemberEntryInsights> => {
    const [targetFeedback, selfTrend, recentReminders] = await Promise.all([
      getMemberDailyTargetFeedback({
        userId: input.userId,
        todaySaleDate: input.todaySaleDate,
      }),
      getMemberSelfTrendSummary({
        userId: input.userId,
        todaySaleDate: input.todaySaleDate,
      }),
      getMemberRecentReminders(input.userId),
    ]);

    return {
      targetFeedback,
      selfTrend,
      recentReminders,
    };
  },
  ["entry-insights-member"],
  {
    tags: [ENTRY_INSIGHTS_CACHE_TAG],
    revalidate: ENTRY_INSIGHTS_CACHE_REVALIDATE_SECONDS,
  },
);

export function getCachedMemberEntryInsights(input: {
  userId: string;
  todaySaleDate: DateValue;
}) {
  return cachedMemberEntryInsights(input);
}

export function refreshEntryInsightsCache() {
  updateTag(ENTRY_INSIGHTS_CACHE_TAG);
}
