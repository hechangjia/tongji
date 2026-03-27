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

import {
  LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  LEADERBOARD_CACHE_TAG,
  getCachedAdminCumulativeTrend,
  getCachedDailyLeaderboard,
  getCachedMemberCumulativeRanking,
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
  });

  test("wraps leaderboard readers in Next cache with shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(4);
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
  });

  test("delegates cached leaderboard reads to the underlying service", async () => {
    getDailyLeaderboardMock.mockResolvedValueOnce([{ userName: "A" }]);
    getRangeLeaderboardMock.mockResolvedValueOnce([{ userName: "B" }]);
    getMemberCumulativeRankingMock.mockResolvedValueOnce([{ userName: "C" }]);
    getAdminCumulativeTrendMock.mockResolvedValueOnce({ series: [{ userName: "D" }] });

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
  });

  test("refreshes the shared leaderboard tag and leaderboard/admin pages", () => {
    refreshLeaderboardCaches();

    expect(updateTagMock).toHaveBeenCalledWith(LEADERBOARD_CACHE_TAG);
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/daily");
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/range");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });
});
