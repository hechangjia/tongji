import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const getAdminInsightsDataMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
}));

vi.mock("@/server/services/admin-insights-service", () => ({
  getAdminInsightsData: getAdminInsightsDataMock,
}));

import {
  ADMIN_INSIGHTS_CACHE_REVALIDATE_SECONDS,
  ADMIN_INSIGHTS_CACHE_TAG,
  getCachedAdminInsightsData,
  refreshAdminInsightsCache,
} from "@/server/services/admin-insights-cache";

describe("admin insights cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    getAdminInsightsDataMock.mockClear();
  });

  test("wraps admin insights reads in Next cache with a shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(1);
    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["admin-insights"],
      {
        tags: [ADMIN_INSIGHTS_CACHE_TAG],
        revalidate: ADMIN_INSIGHTS_CACHE_REVALIDATE_SECONDS,
      },
    );
  });

  test("delegates cached admin insights reads to the underlying service", async () => {
    getAdminInsightsDataMock.mockResolvedValue({
      overview: {
        highRiskCount: 0,
        mediumRiskCount: 0,
        targetCompletionRate: 0,
        remindersSentCount: 0,
      },
      anomalyDistribution: [],
      memberCards: [],
      processedCards: [],
    });

    await expect(
      getCachedAdminInsightsData({
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toMatchObject({
      overview: {
        highRiskCount: 0,
      },
    });

    expect(getAdminInsightsDataMock).toHaveBeenCalledWith({
      todaySaleDate: "2026-03-27",
    });
  });

  test("refreshes the shared admin insights tag", () => {
    refreshAdminInsightsCache();

    expect(updateTagMock).toHaveBeenCalledWith(ADMIN_INSIGHTS_CACHE_TAG);
  });
});
