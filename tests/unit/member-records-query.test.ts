import { describe, expect, test } from "vitest";
import { groupRecordsForMember } from "@/server/services/sales-service";

describe("member records query", () => {
  test("sorts records by date descending", () => {
    const result = groupRecordsForMember([
      { saleDate: new Date("2026-07-01") },
      { saleDate: new Date("2026-07-03") },
    ] as never);

    expect(result[0].saleDate.toISOString()).toContain("2026-07-03");
  });
});
