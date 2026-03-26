import { describe, expect, test } from "vitest";
import { filterSalesRows } from "@/server/services/sales-service";

describe("admin sales filters", () => {
  test("filters by username", () => {
    const rows = filterSalesRows(
      [
        { userName: "alice" },
        { userName: "bob" },
      ] as never,
      { keyword: "ali" },
    );

    expect(rows).toHaveLength(1);
  });
});
