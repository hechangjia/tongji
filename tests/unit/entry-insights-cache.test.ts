import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const getMemberDailyTargetFeedbackMock = vi.hoisted(() => vi.fn());
const getMemberSelfTrendSummaryMock = vi.hoisted(() => vi.fn());
const getMemberRecentRemindersMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
}));

vi.mock("@/server/services/daily-target-service", () => ({
  getMemberDailyTargetFeedback: getMemberDailyTargetFeedbackMock,
  getMemberSelfTrendSummary: getMemberSelfTrendSummaryMock,
}));

vi.mock("@/server/services/member-reminder-service", () => ({
  getMemberRecentReminders: getMemberRecentRemindersMock,
}));

import {
  ENTRY_INSIGHTS_CACHE_REVALIDATE_SECONDS,
  ENTRY_INSIGHTS_CACHE_TAG,
  getCachedMemberEntryInsights,
  refreshEntryInsightsCache,
} from "@/server/services/entry-insights-cache";

describe("entry insights cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    getMemberDailyTargetFeedbackMock.mockClear();
    getMemberSelfTrendSummaryMock.mockClear();
    getMemberRecentRemindersMock.mockClear();
  });

  test("wraps member entry insights in Next cache with a shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(1);
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["entry-insights-member"],
      {
        tags: [ENTRY_INSIGHTS_CACHE_TAG],
        revalidate: ENTRY_INSIGHTS_CACHE_REVALIDATE_SECONDS,
      },
    );
  });

  test("delegates cached entry insight reads to the underlying services", async () => {
    getMemberDailyTargetFeedbackMock.mockResolvedValue({
      targetTotal: 8,
      currentTotal: 5,
      gap: 3,
      completionRate: 63,
      status: "BEHIND",
    });
    getMemberSelfTrendSummaryMock.mockResolvedValue({
      direction: "DOWN",
      label: "低于近 7 天常态",
      message: "今天的完成度低于你最近几天的平均水平。",
    });
    getMemberRecentRemindersMock.mockResolvedValue([
      {
        id: "reminder-1",
        type: "TARGET_GAP",
        title: "今日目标仍有差距",
        content: "你今天距离目标还差 3 单，请尽快跟进。",
        sentAtIso: "2026-03-27T09:00:00.000Z",
        senderName: "系统管理员",
        status: "UNREAD",
      },
    ]);

    await expect(
      getCachedMemberEntryInsights({
        userId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toEqual({
      targetFeedback: {
        targetTotal: 8,
        currentTotal: 5,
        gap: 3,
        completionRate: 63,
        status: "BEHIND",
      },
      selfTrend: {
        direction: "DOWN",
        label: "低于近 7 天常态",
        message: "今天的完成度低于你最近几天的平均水平。",
      },
      recentReminders: [
        {
          id: "reminder-1",
          type: "TARGET_GAP",
          title: "今日目标仍有差距",
          content: "你今天距离目标还差 3 单，请尽快跟进。",
          sentAtIso: "2026-03-27T09:00:00.000Z",
          senderName: "系统管理员",
          status: "UNREAD",
        },
      ],
    });

    expect(getMemberDailyTargetFeedbackMock).toHaveBeenCalledWith({
      userId: "member-1",
      todaySaleDate: "2026-03-27",
    });
    expect(getMemberSelfTrendSummaryMock).toHaveBeenCalledWith({
      userId: "member-1",
      todaySaleDate: "2026-03-27",
    });
    expect(getMemberRecentRemindersMock).toHaveBeenCalledWith("member-1");
  });

  test("refreshes the shared entry insights tag", () => {
    refreshEntryInsightsCache();

    expect(updateTagMock).toHaveBeenCalledWith(ENTRY_INSIGHTS_CACHE_TAG);
  });
});
