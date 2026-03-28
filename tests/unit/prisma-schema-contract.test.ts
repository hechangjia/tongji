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

  test("locks daily target and reminder models", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("enum ReminderStatus");
    expect(schema).toContain("model DailyTarget");
    expect(schema).toContain("model MemberReminder");
    expect(schema).toMatch(/targetDate\s+DateTime\s+@db\.Date/);
    expect(schema).toMatch(/finalTotal\s+Int/);
    expect(schema).toMatch(/status\s+ReminderStatus/);
  });

  test("locks group and leader foundation in Prisma schema", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("enum Role");
    expect(schema).toContain("LEADER");
    expect(schema).toContain("model Group");
    expect(schema).toMatch(/remark\s+String\?/);
    expect(schema).toMatch(/groupId\s+String\?/);
  });

  test("locks identifier code and prospect lead foundation in Prisma schema", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("enum IdentifierCodeStatus");
    expect(schema).toContain("enum ProspectLeadStatus");
    expect(schema).toContain("model IdentifierImportBatch");
    expect(schema).toContain("model IdentifierCode");
    expect(schema).toContain("model CodeAssignment");
    expect(schema).toContain("model ProspectImportBatch");
    expect(schema).toContain("model ProspectLead");
    expect(schema).toMatch(/assignedGroupId\s+String\?/);
    expect(schema).toMatch(/qqNumber\s+String\s+@unique/);
    expect(schema).toMatch(/code\s+String\s+@unique/);
  });

  test("locks member identifier sale bridge schema", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");

    expect(schema).toContain("enum PlanType");
    expect(schema).toContain("enum ProspectLeadSourceType");
    expect(schema).toMatch(/enum ProspectLeadStatus[\s\S]*CONVERTED/);
    expect(schema).toContain("model IdentifierSale");
    expect(schema).toMatch(/sourceType\s+ProspectLeadSourceType/);
    expect(schema).toMatch(/importBatchId\s+String\?/);
    expect(schema).toMatch(/prospectLeadId\s+String/);
    expect(schema).toMatch(/planType\s+PlanType/);
  });
});
