import { describe, expect, test } from "vitest";
import { hasOverlappingRules } from "@/server/services/commission-service";

describe("commission overlap detection", () => {
  test("rejects overlapping date ranges for same user", () => {
    expect(
      hasOverlappingRules([
        {
          start: new Date("2026-07-01"),
          end: new Date("2026-07-31"),
        },
        {
          start: new Date("2026-07-15"),
          end: new Date("2026-08-15"),
        },
      ]),
    ).toBe(true);
  });
});
