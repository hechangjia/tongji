import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { salesReviewActionSchema } from "@/lib/validators/sales";

describe("prisma schema", () => {
  test("contains core models", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("model User");
    expect(schema).toContain("model SalesRecord");
    expect(schema).toContain("model CommissionRule");
    expect(schema).toContain("model BannerQuote");
    expect(schema).toContain("model BannerSettings");
    expect(schema).toContain("model Announcement");
  });

  test("locks sales review contract fields", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("enum SalesReviewStatus");
    expect(schema).toContain("lastSubmittedAt DateTime?");
    expect(schema).toMatch(/reviewStatus\s+SalesReviewStatus\s+@default\(PENDING\)/);
    expect(schema).toMatch(/reviewedAt\s+DateTime\?/);
    expect(schema).toMatch(/reviewNote\s+String\?/);
  });

  test("accepts valid sales review action payload", () => {
    expect(() =>
      salesReviewActionSchema.parse({
        id: "record-1",
        decision: "APPROVED",
        returnTo: "/admin/sales",
      }),
    ).not.toThrow();
  });
});
