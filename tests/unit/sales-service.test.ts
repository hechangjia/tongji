import { describe, expect, test } from "vitest";
import { normalizeSalePayload } from "@/server/services/sales-service";

describe("sales payload", () => {
  test("accepts non-negative integer counts", () => {
    expect(
      normalizeSalePayload({
        saleDate: "2026-03-26",
        count40: 2,
        count60: 1,
      }),
    ).toMatchObject({
      saleDate: "2026-03-26",
      count40: 2,
      count60: 1,
      remark: undefined,
    });
  });
});
