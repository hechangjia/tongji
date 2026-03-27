import { beforeEach, describe, expect, test, vi } from "vitest";

const userFindManyMock = vi.hoisted(() => vi.fn());
const memberReminderCountMock = vi.hoisted(() => vi.fn());
const dailyTargetUpsertMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: userFindManyMock,
    },
    memberReminder: {
      count: memberReminderCountMock,
    },
    dailyTarget: {
      upsert: dailyTargetUpsertMock,
    },
  },
}));

import {
  buildAdminInsightMemberCard,
  getAdminInsightsData,
} from "@/server/services/admin-insights-service";

describe("admin insights service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("buildAdminInsightMemberCard returns risk level, reason tags, and recommended actions", () => {
    expect(
      buildAdminInsightMemberCard({
        userId: "member-1",
        userName: "成员1",
        targetTotal: 8,
        currentTotal: 3,
        recentAverageTotal: 7,
        recentLateSubmissionCount: 1,
        recentRejectedCount: 1,
        recentDeclineDelta: 4,
      }),
    ).toMatchObject({
      riskLevel: "HIGH",
      reasonTags: expect.arrayContaining(["结果下滑", "目标偏差过大"]),
      recommendedActions: expect.arrayContaining(["ADJUST_TARGET", "SEND_REMINDER"]),
    });
  });

  test("getAdminInsightsData auto-creates today's target for members without one", async () => {
    userFindManyMock.mockResolvedValue([
      {
        id: "member-1",
        username: "member01",
        name: "成员1",
        salesRecords: [
          {
            saleDate: new Date("2026-03-27T00:00:00.000Z"),
            count40: 1,
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
        ],
        dailyTargets: [],
      },
    ]);
    memberReminderCountMock.mockResolvedValue(0);
    dailyTargetUpsertMock.mockResolvedValue({
      id: "target-1",
      finalTotal: 4,
      suggestedTotal: 4,
      suggestionReason: "近 7 天平均约 5 单，最近状态存在波动，建议目标适度保守",
    });

    await expect(
      getAdminInsightsData({
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toMatchObject({
      memberCards: [
        expect.objectContaining({
          userId: "member-1",
          targetId: "target-1",
          targetTotal: 4,
        }),
      ],
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
