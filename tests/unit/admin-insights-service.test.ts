import { describe, expect, test } from "vitest";
import { buildAdminInsightMemberCard } from "@/server/services/admin-insights-service";

describe("admin insights service", () => {
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
});
