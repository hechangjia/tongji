import { describe, expect, test } from "vitest";
import { buildSuggestedDailyTarget } from "@/server/services/daily-target-service";

describe("daily target service", () => {
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
});
