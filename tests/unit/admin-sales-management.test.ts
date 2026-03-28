import { describe, expect, test } from "vitest";
import { buildAdminTodaySalesRows, type DailyRhythmSourceRow } from "@/server/services/daily-rhythm-service";
import { filterSalesRows } from "@/server/services/sales-service";

describe("admin sales filters", () => {
  test("filters by username", () => {
    const rows = filterSalesRows(
      [
        { userName: "alice" },
        { userName: "bob" },
      ],
      { keyword: "ali" },
    );

    expect(rows).toHaveLength(1);
  });

  test("orders today rows by review status, lastSubmittedAt asc, then id asc", () => {
    const rows: DailyRhythmSourceRow[] = [
      createRow({
        id: "approved-b",
        userId: "member-4",
        userName: "成员4",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:03:00.000Z"),
      }),
      createRow({
        id: "pending-b",
        userId: "member-2",
        userName: "成员2",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
      }),
      createRow({
        id: "rejected-a",
        userId: "member-6",
        userName: "成员6",
        reviewStatus: "REJECTED",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
      }),
      createRow({
        id: "approved-a",
        userId: "member-3",
        userName: "成员3",
        reviewStatus: "APPROVED",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
      }),
      createRow({
        id: "pending-a",
        userId: "member-1",
        userName: "成员1",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T16:01:00.000Z"),
      }),
      createRow({
        id: "rejected-b",
        userId: "member-5",
        userName: "成员5",
        reviewStatus: "REJECTED",
        lastSubmittedAt: new Date("2026-03-26T16:02:00.000Z"),
      }),
    ];

    expect(buildAdminTodaySalesRows(rows, "2026-03-27").map((row) => row.id)).toEqual([
      "pending-a",
      "pending-b",
      "approved-a",
      "approved-b",
      "rejected-a",
      "rejected-b",
    ]);
  });
});

function createRow(overrides: Partial<DailyRhythmSourceRow>): DailyRhythmSourceRow {
  return {
    id: overrides.id ?? "record-1",
    userId: overrides.userId ?? "member-1",
    userName: overrides.userName ?? "成员1",
    role: overrides.role ?? "MEMBER",
    status: overrides.status ?? "ACTIVE",
    saleDate: overrides.saleDate ?? "2026-03-27",
    count40: overrides.count40 ?? 1,
    count60: overrides.count60 ?? 0,
    remark: overrides.remark ?? null,
    reviewStatus: overrides.reviewStatus ?? "PENDING",
    lastSubmittedAt:
      overrides.lastSubmittedAt ?? new Date("2026-03-26T16:00:00.000Z"),
    reviewedAt: overrides.reviewedAt ?? null,
    reviewNote: overrides.reviewNote ?? null,
  };
}
