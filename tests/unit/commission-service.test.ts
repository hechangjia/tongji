import { beforeEach, describe, expect, test, vi } from "vitest";

const commissionRuleFindManyMock = vi.hoisted(() => vi.fn());
const commissionRuleCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    commissionRule: {
      findMany: commissionRuleFindManyMock,
      create: commissionRuleCreateMock,
    },
  },
}));

import {
  hasOverlappingRules,
  createCommissionRule,
  getCommissionRules,
} from "@/server/services/commission-service";

describe("commission overlap detection", () => {
  test("rejects overlapping date ranges", () => {
    expect(
      hasOverlappingRules([
        { start: new Date("2026-07-01"), end: new Date("2026-07-31") },
        { start: new Date("2026-07-15"), end: new Date("2026-08-15") },
      ]),
    ).toBe(true);
  });

  test("accepts non-overlapping date ranges", () => {
    expect(
      hasOverlappingRules([
        { start: new Date("2026-07-01"), end: new Date("2026-07-31") },
        { start: new Date("2026-08-15"), end: new Date("2026-09-15") },
      ]),
    ).toBe(false);
  });

  test("accepts adjacent ranges that share a boundary", () => {
    expect(
      hasOverlappingRules([
        { start: new Date("2026-07-01"), end: new Date("2026-07-31") },
        { start: new Date("2026-08-01"), end: new Date("2026-08-31") },
      ]),
    ).toBe(false);
  });

  test("detects overlap with open-ended rule (null end)", () => {
    expect(
      hasOverlappingRules([
        { start: new Date("2026-07-01"), end: null },
        { start: new Date("2026-09-01"), end: new Date("2026-09-30") },
      ]),
    ).toBe(true);
  });

  test("returns false for a single rule", () => {
    expect(
      hasOverlappingRules([
        { start: new Date("2026-07-01"), end: new Date("2026-07-31") },
      ]),
    ).toBe(false);
  });

  test("returns false for empty list", () => {
    expect(hasOverlappingRules([])).toBe(false);
  });
});

describe("createCommissionRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates rule when no overlap with existing rules", async () => {
    commissionRuleFindManyMock.mockResolvedValue([]);
    commissionRuleCreateMock.mockResolvedValue({});

    await createCommissionRule({
      userId: "member-1",
      price40: 10,
      price60: 15,
      effectiveStart: "2026-07-01",
      effectiveEnd: "2026-07-31",
    });

    expect(commissionRuleCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "member-1",
        price40: 10,
        price60: 15,
        effectiveStart: new Date("2026-07-01T00:00:00.000Z"),
        effectiveEnd: new Date("2026-07-31T00:00:00.000Z"),
      },
    });
  });

  test("creates open-ended rule with null effectiveEnd", async () => {
    commissionRuleFindManyMock.mockResolvedValue([]);
    commissionRuleCreateMock.mockResolvedValue({});

    await createCommissionRule({
      userId: "member-1",
      price40: 10,
      price60: 15,
      effectiveStart: "2026-07-01",
      effectiveEnd: "",
    });

    expect(commissionRuleCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        effectiveEnd: null,
      }),
    });
  });

  test("throws when new rule overlaps existing rules", async () => {
    commissionRuleFindManyMock.mockResolvedValue([
      {
        effectiveStart: new Date("2026-07-01T00:00:00.000Z"),
        effectiveEnd: new Date("2026-07-31T00:00:00.000Z"),
      },
    ]);

    await expect(
      createCommissionRule({
        userId: "member-1",
        price40: 10,
        price60: 15,
        effectiveStart: "2026-07-15",
        effectiveEnd: "2026-08-15",
      }),
    ).rejects.toThrow("该成员的卡酬规则时间段存在重叠");

    expect(commissionRuleCreateMock).not.toHaveBeenCalled();
  });
});

describe("getCommissionRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns all rules with user info ordered by effectiveStart desc", async () => {
    const mockRules = [
      { id: "rule-1", userId: "member-1", user: { name: "Alice", username: "alice" } },
    ];
    commissionRuleFindManyMock.mockResolvedValue(mockRules);

    const result = await getCommissionRules();

    expect(result).toEqual(mockRules);
    expect(commissionRuleFindManyMock).toHaveBeenCalledWith({
      include: {
        user: {
          select: { name: true, username: true },
        },
      },
      orderBy: [{ effectiveStart: "desc" }, { createdAt: "desc" }],
    });
  });
});
