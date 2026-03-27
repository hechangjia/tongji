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

  test("migration backfills legacy sales records as approved instead of leaving history pending", () => {
    const migration = readFileSync(
      "prisma/migrations/20260327104000_add_sales_review_audit_fields/migration.sql",
      "utf8",
    );

    expect(migration).toMatch(/UPDATE\s+"sales_records"/);
    expect(migration).toMatch(/"reviewStatus"\s*=\s*'APPROVED'/);
    expect(migration).toMatch(/"lastSubmittedAt"\s*=\s*COALESCE\("updatedAt",\s*"createdAt"\)/);
    expect(migration).toMatch(/"reviewedAt"\s*=\s*COALESCE\("updatedAt",\s*"createdAt"\)/);
  });
});
