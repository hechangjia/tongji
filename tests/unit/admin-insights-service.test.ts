import { beforeEach, describe, expect, test, vi } from "vitest";

const userFindManyMock = vi.hoisted(() => vi.fn());
const memberReminderCountMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: userFindManyMock,
    },
    memberReminder: {
      count: memberReminderCountMock,
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

  test("getAdminInsightsData computes a fallback target without writing when today is missing", async () => {
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

    await expect(
      getAdminInsightsData({
        todaySaleDate: "2026-03-27",
      }),
    ).resolves.toMatchObject({
      memberCards: [
        expect.objectContaining({
          userId: "member-1",
          targetId: null,
          targetDate: "2026-03-27",
          targetTotal: 4,
        }),
      ],
    });
  });
});
