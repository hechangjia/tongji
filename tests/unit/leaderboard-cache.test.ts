import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const getDailyLeaderboardMock = vi.hoisted(() => vi.fn());
const getRangeLeaderboardMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/leaderboard-service", () => ({
  getDailyLeaderboard: getDailyLeaderboardMock,
  getRangeLeaderboard: getRangeLeaderboardMock,
}));

import {
  LEADERBOARD_CACHE_REVALIDATE_SECONDS,
  LEADERBOARD_CACHE_TAG,
  getCachedDailyLeaderboard,
  getCachedRangeLeaderboard,
  refreshLeaderboardCaches,
} from "@/server/services/leaderboard-cache";

describe("leaderboard cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    revalidatePathMock.mockClear();
    getDailyLeaderboardMock.mockClear();
    getRangeLeaderboardMock.mockClear();
  });

  test("wraps leaderboard readers in Next cache with shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(2);
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
  });

  test("delegates cached leaderboard reads to the underlying service", async () => {
    getDailyLeaderboardMock.mockResolvedValueOnce([{ userName: "A" }]);
    getRangeLeaderboardMock.mockResolvedValueOnce([{ userName: "B" }]);

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
  });

  test("refreshes the shared leaderboard tag and both leaderboard pages", () => {
    refreshLeaderboardCaches();

    expect(updateTagMock).toHaveBeenCalledWith(LEADERBOARD_CACHE_TAG);
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/daily");
    expect(revalidatePathMock).toHaveBeenCalledWith("/leaderboard/range");
  });
});
