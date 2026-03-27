import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const getDailyLeaderboardMock = vi.hoisted(() => vi.fn());
const getRangeLeaderboardMock = vi.hoisted(() => vi.fn());
const getMemberCumulativeRankingMock = vi.hoisted(() => vi.fn());
const getAdminCumulativeTrendMock = vi.hoisted(() => vi.fn());
const getMemberDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const getAdminDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const getDailyTop3StatusMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/leaderboard-service", () => ({
  getDailyLeaderboard: getDailyLeaderboardMock,
  getRangeLeaderboard: getRangeLeaderboardMock,
}));

vi.mock("@/server/services/cumulative-sales-stats-service", () => ({
  getMemberCumulativeRanking: getMemberCumulativeRankingMock,
  getAdminCumulativeTrend: getAdminCumulativeTrendMock,
}));

vi.mock("@/server/services/daily-rhythm-service", () => ({
  getMemberDailyRhythmSummary: getMemberDailyRhythmSummaryMock,
  getAdminDailyRhythmSummary: getAdminDailyRhythmSummaryMock,
  getDailyTop3Status: getDailyTop3StatusMock,
}));

import {
  LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  LEADERBOARD_CACHE_TAG,
  getCachedAdminCumulativeTrend,
  getCachedAdminDailyRhythmSummary,
  getCachedDailyLeaderboard,
  getCachedDailyTop3Status,
  getCachedMemberCumulativeRanking,
  getCachedMemberDailyRhythmSummary,
  getCachedRangeLeaderboard,
  refreshLeaderboardCaches,
} from "@/server/services/leaderboard-cache";

describe("leaderboard cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    revalidatePathMock.mockClear();
    getDailyLeaderboardMock.mockClear();
    getRangeLeaderboardMock.mockClear();
    getMemberCumulativeRankingMock.mockClear();
    getAdminCumulativeTrendMock.mockClear();
    getMemberDailyRhythmSummaryMock.mockClear();
    getAdminDailyRhythmSummaryMock.mockClear();
    getDailyTop3StatusMock.mockClear();
  });

  test("wraps leaderboard readers in Next cache with shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(7);
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      ["leaderboard-daily"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      ["leaderboard-range"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      3,
      expect.any(Function),
      ["leaderboard-member-cumulative-ranking"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      4,
      expect.any(Function),
      ["leaderboard-admin-cumulative-trend"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      5,
      expect.any(Function),
      ["leaderboard-member-daily-rhythm-summary"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      6,
      expect.any(Function),
      ["leaderboard-admin-daily-rhythm-summary"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      7,
      expect.any(Function),
      ["leaderboard-daily-top3-status"],
      {
        tags: [LEADERBOARD_CACHE_TAG],
        revalidate: LEADERBOARD_CACHE_REVALIDATE_SECONDS,
      },
    );
  });

  test("delegates cached leaderboard reads to the underlying service", async () => {
    getDailyLeaderboardMock.mockResolvedValueOnce([{ userName: "A" }]);
    getRangeLeaderboardMock.mockResolvedValueOnce([{ userName: "B" }]);
    getMemberCumulativeRankingMock.mockResolvedValueOnce([{ userName: "C" }]);
    getAdminCumulativeTrendMock.mockResolvedValueOnce({ series: [{ userName: "D" }] });
    getMemberDailyRhythmSummaryMock.mockResolvedValueOnce({ state: "PENDING_REVIEW" });
    getAdminDailyRhythmSummaryMock.mockResolvedValueOnce({ pendingCount: 1 });
    getDailyTop3StatusMock.mockResolvedValueOnce({
      temporaryTop3: [{ userName: "E" }],
      formalTop3: [{ userName: "F" }],
    });

    await expect(getCachedDailyLeaderboard("2026-03-26")).resolves.toEqual([
      { userName: "A" },
    ]);
    await expect(
      getCachedRangeLeaderboard("2026-03-01", "2026-03-26"),
    ).resolves.toEqual([{ userName: "B" }]);

    expect(getDailyLeaderboardMock).toHaveBeenCalledWith("2026-03-26");
    expect(getRangeLeaderboardMock).toHaveBeenCalledWith(
      "2026-03-01",
      "2026-03-26",
    );

    await expect(
      getCachedMemberCumulativeRanking({
        startDate: "2026-03-01",
        endDate: "2026-03-26",
        currentUserId: "member-1",
      }),
    ).resolves.toEqual([{ userName: "C" }]);
    await expect(
      getCachedAdminCumulativeTrend({
        preset: "MONTH",
        metric: "TOTAL",
      }),
    ).resolves.toEqual({ series: [{ userName: "D" }] });
    await expect(
      getCachedMemberDailyRhythmSummary({
        currentUserId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toEqual({ state: "PENDING_REVIEW" });
    await expect(
      getCachedAdminDailyRhythmSummary({
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toEqual({ pendingCount: 1 });
    await expect(getCachedDailyTop3Status("2026-03-27")).resolves.toEqual({
      temporaryTop3: [{ userName: "E" }],
      formalTop3: [{ userName: "F" }],
    });

    expect(getMemberDailyRhythmSummaryMock).toHaveBeenCalledWith({
      currentUserId: "member-1",
      todaySaleDate: "2026-03-27",
    });
    expect(getAdminDailyRhythmSummaryMock).toHaveBeenCalledWith({
      todaySaleDate: "2026-03-27",
    });
    expect(getDailyTop3StatusMock).toHaveBeenCalledWith("2026-03-27");
  });

  test("refreshes the shared leaderboard tag and leaderboard/admin pages", () => {
    refreshLeaderboardCaches();

    expect(updateTagMock).toHaveBeenCalledWith(LEADERBOARD_CACHE_TAG);
    expect(revalidatePathMock).toHaveBeenCalledWith("/entry");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/daily");
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/range");
  });
});
