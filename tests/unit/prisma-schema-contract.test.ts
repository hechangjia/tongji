import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { salesReviewActionSchema } from "@/lib/validators/sales";

function getPrismaBlock(
  schema: string,
  blockType: "enum" | "model",
  name: string,
): string {
  const match = schema.match(
    new RegExp(`${blockType}\\s+${name}\\s+\\{[\\s\\S]*?\\n\\}`, "m"),
  );

  expect(match, `Missing ${blockType} ${name}`).not.toBeNull();
  return match![0];
}

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

  test("locks leader workbench schema contract", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const identifierCodeBlock = getPrismaBlock(schema, "model", "IdentifierCode");
    const followUpSourceTypeBlock = getPrismaBlock(
      schema,
      "enum",
      "GroupFollowUpSourceType",
    );
    const followUpStatusBlock = getPrismaBlock(
      schema,
      "enum",
      "GroupFollowUpStatus",
    );
    const auditResourceTypeBlock = getPrismaBlock(
      schema,
      "enum",
      "GroupResourceAuditResourceType",
    );
    const auditActionTypeBlock = getPrismaBlock(
      schema,
      "enum",
      "GroupResourceAuditActionType",
    );
    const followUpItemBlock = getPrismaBlock(schema, "model", "GroupFollowUpItem");
    const auditLogBlock = getPrismaBlock(schema, "model", "GroupResourceAuditLog");

    expect(followUpSourceTypeBlock).toMatch(
      /enum GroupFollowUpSourceType\s+\{\s*PROSPECT_LEAD\s+MANUAL_DISCOVERY\s*\}/,
    );
    expect(followUpStatusBlock).toMatch(
      /enum GroupFollowUpStatus\s+\{\s*UNTOUCHED\s+FOLLOWING_UP\s+APPOINTED\s+READY_TO_CONVERT\s+INVALID\s+CONVERTED\s*\}/,
    );
    expect(auditResourceTypeBlock).toMatch(
      /enum GroupResourceAuditResourceType\s+\{\s*FOLLOW_UP_ITEM\s+PROSPECT_LEAD\s+IDENTIFIER_CODE\s*\}/,
    );
    expect(auditActionTypeBlock).toMatch(
      /enum GroupResourceAuditActionType\s+\{\s*CREATE_MANUAL_FOLLOW_UP\s+REASSIGN\s+RETURN_TO_GROUP_POOL\s+STATUS_CHANGE\s+CONVERTED_LINKED\s*\}/,
    );

    expect(identifierCodeBlock).toMatch(/assignedGroupId\s+String\?/);
    expect(identifierCodeBlock).toMatch(
      /assignedGroup\s+Group\?\s+@relation\("IdentifierCodeAssignedGroup"[\s\S]*onDelete:\s*SetNull\)/,
    );
    expect(identifierCodeBlock).toMatch(/@@index\(\[assignedGroupId,\s*status\]\)/);

    expect(followUpItemBlock).toMatch(/groupId\s+String/);
    expect(followUpItemBlock).toMatch(/currentOwnerUserId\s+String\?/);
    expect(followUpItemBlock).toMatch(/sourceType\s+GroupFollowUpSourceType/);
    expect(followUpItemBlock).toMatch(/prospectLeadId\s+String\?/);
    expect(followUpItemBlock).toMatch(
      /status\s+GroupFollowUpStatus\s+@default\(UNTOUCHED\)/,
    );
    expect(followUpItemBlock).toMatch(/summaryNote\s+String\?/);
    expect(followUpItemBlock).toMatch(/createdByUserId\s+String/);
    expect(followUpItemBlock).toMatch(/lastActionAt\s+DateTime\s+@default\(now\(\)\)/);
    expect(followUpItemBlock).toMatch(/convertedAt\s+DateTime\?/);
    expect(followUpItemBlock).toMatch(/group\s+Group\s+@relation\(/);
    expect(followUpItemBlock).toMatch(/currentOwnerUser\s+User\?\s+@relation\(/);
    expect(followUpItemBlock).toMatch(/prospectLead\s+ProspectLead\?\s+@relation\(/);
    expect(followUpItemBlock).toMatch(/@@index\(\[groupId,\s*status,\s*lastActionAt\]\)/);
    expect(followUpItemBlock).toMatch(/@@index\(\[currentOwnerUserId,\s*status\]\)/);

    expect(auditLogBlock).toMatch(/groupId\s+String/);
    expect(auditLogBlock).toMatch(/operatorUserId\s+String/);
    expect(auditLogBlock).toMatch(
      /resourceType\s+GroupResourceAuditResourceType/,
    );
    expect(auditLogBlock).toMatch(/resourceId\s+String/);
    expect(auditLogBlock).toMatch(/actionType\s+GroupResourceAuditActionType/);
    expect(auditLogBlock).toMatch(/beforeSnapshot\s+Json\?/);
    expect(auditLogBlock).toMatch(/afterSnapshot\s+Json\?/);
    expect(auditLogBlock).toMatch(/reason\s+String/);
    expect(auditLogBlock).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
    expect(auditLogBlock).toMatch(/@@index\(\[groupId,\s*createdAt\]\)/);
  });

  test("locks leader workbench migration contract", () => {
    const migration = readFileSync(
      "prisma/migrations/20260329183000_add_leader_workbench_and_group_leaderboard/migration.sql",
      "utf8",
    );

    expect(migration).toMatch(
      /CREATE TYPE "GroupFollowUpSourceType" AS ENUM \('PROSPECT_LEAD', 'MANUAL_DISCOVERY'\);/,
    );
    expect(migration).toMatch(
      /CREATE TYPE "GroupFollowUpStatus" AS ENUM \('UNTOUCHED', 'FOLLOWING_UP', 'APPOINTED', 'READY_TO_CONVERT', 'INVALID', 'CONVERTED'\);/,
    );
    expect(migration).toMatch(
      /CREATE TYPE "GroupResourceAuditResourceType" AS ENUM \('FOLLOW_UP_ITEM', 'PROSPECT_LEAD', 'IDENTIFIER_CODE'\);/,
    );
    expect(migration).toMatch(
      /CREATE TYPE "GroupResourceAuditActionType" AS ENUM \('CREATE_MANUAL_FOLLOW_UP', 'REASSIGN', 'RETURN_TO_GROUP_POOL', 'STATUS_CHANGE', 'CONVERTED_LINKED'\);/,
    );

    expect(migration).toContain('CREATE TABLE "group_follow_up_items"');
    expect(migration).toContain('CREATE TABLE "group_resource_audit_logs"');
    expect(migration).toContain('"reason" TEXT NOT NULL');

    expect(migration).toMatch(/CREATE INDEX "identifier_codes_assignedGroupId_status_idx"/);
    expect(migration).toMatch(
      /CREATE INDEX "group_follow_up_items_groupId_status_lastActionAt_idx"/,
    );
    expect(migration).toMatch(
      /CREATE INDEX "group_follow_up_items_currentOwnerUserId_status_idx"/,
    );
    expect(migration).toMatch(
      /CREATE INDEX "group_resource_audit_logs_groupId_createdAt_idx"/,
    );

    expect(migration).toContain(
      'ADD CONSTRAINT "group_follow_up_items_sourceType_prospectLeadId_check"',
    );
    expect(migration).toContain(
      'CHECK (("sourceType" = \'PROSPECT_LEAD\' AND "prospectLeadId" IS NOT NULL) OR ("sourceType" = \'MANUAL_DISCOVERY\' AND "prospectLeadId" IS NULL))',
    );
    expect(migration).toContain(
      "-- NOTE: On large deployed tables, roll out the identifier_codes index/FK in a maintenance window or online migration strategy.",
    );

    expect(migration).toContain(
      'ADD CONSTRAINT "identifier_codes_assignedGroupId_fkey"',
    );
  });
});
