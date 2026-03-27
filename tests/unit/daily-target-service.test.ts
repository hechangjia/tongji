import { beforeEach, describe, expect, test, vi } from "vitest";

const dailyTargetFindUniqueMock = vi.hoisted(() => vi.fn());
const dailyTargetUpsertMock = vi.hoisted(() => vi.fn());
const salesRecordFindUniqueMock = vi.hoisted(() => vi.fn());
const salesRecordFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    dailyTarget: {
      findUnique: dailyTargetFindUniqueMock,
      upsert: dailyTargetUpsertMock,
    },
    salesRecord: {
      findUnique: salesRecordFindUniqueMock,
      findMany: salesRecordFindManyMock,
    },
  },
}));

import {
  buildSuggestedDailyTarget,
  getMemberDailyTargetFeedback,
} from "@/server/services/daily-target-service";

describe("daily target service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("buildSuggestedDailyTarget uses recent sales and recent status signals", () => {
    expect(
      buildSuggestedDailyTarget({
        recentAverageTotal: 5.6,
        recentLateSubmissionCount: 0,
        recentRejectedCount: 0,
      }),
    ).toMatchObject({
      suggestedTotal: 6,
      suggestionReason: expect.stringContaining("近 7 天"),
    });
  });

  test("getMemberDailyTargetFeedback auto-creates today's target when it is missing", async () => {
    dailyTargetFindUniqueMock.mockResolvedValue(null);
    dailyTargetUpsertMock.mockResolvedValue({
      id: "target-1",
      userId: "member-1",
      targetDate: new Date("2026-03-27T00:00:00.000Z"),
      suggestedTotal: 4,
      finalTotal: 4,
      suggestionReason: "近 7 天平均约 5 单，最近状态存在波动，建议目标适度保守",
    });
    salesRecordFindUniqueMock.mockResolvedValue({
      count40: 2,
      count60: 1,
    });
    salesRecordFindManyMock.mockResolvedValue([
      {
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 2,
        count60: 1,
        reviewStatus: "PENDING",
      },
      {
        saleDate: new Date("2026-03-26T00:00:00.000Z"),
        count40: 4,
        count60: 2,
        reviewStatus: "APPROVED",
      },
      {
        saleDate: new Date("2026-03-25T00:00:00.000Z"),
        count40: 3,
        count60: 1,
        reviewStatus: "REJECTED",
      },
    ]);

    await expect(
      getMemberDailyTargetFeedback({
        userId: "member-1",
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toMatchObject({
      targetTotal: 4,
      currentTotal: 3,
      gap: 1,
      status: "BEHIND",
    });

    expect(dailyTargetUpsertMock).toHaveBeenCalledWith({
      where: {
        userId_targetDate: {
          userId: "member-1",
          targetDate: new Date("2026-03-27T00:00:00.000Z"),
        },
      },
      update: {
        suggestedTotal: 4,
        suggestionReason: expect.stringContaining("近 7 天平均约 5 单"),
      },
      create: {
        userId: "member-1",
        targetDate: new Date("2026-03-27T00:00:00.000Z"),
        suggestedTotal: 4,
        finalTotal: 4,
        suggestionReason: expect.stringContaining("近 7 天平均约 5 单"),
      },
    });
  });
});
