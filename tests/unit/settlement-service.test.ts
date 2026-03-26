import { describe, expect, test } from "vitest";
import { calculateSettlementRow } from "@/server/services/settlement-service";

describe("settlement calculation", () => {
  test("calculates amount from matched commission rule", () => {
    const row = calculateSettlementRow(
      { count40: 2, count60: 1 },
      { price40: 10, price60: 20 },
    );

    expect(row.amount).toBe(40);
    expect(row.status).toBe("OK");
  });

  test("flags missing rule instead of defaulting to zero", () => {
    const row = calculateSettlementRow({ count40: 2, count60: 1 }, null);

    expect(row.status).toBe("MISSING_RULE");
    expect(row.amount).toBeNull();
  });
});
