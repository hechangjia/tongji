import { describe, expect, test } from "vitest";
import {
  createManualFollowUpSchema,
  reassignFollowUpSchema,
  updateFollowUpStatusSchema,
  reassignIdentifierCodeSchema,
} from "@/lib/validators/leader-workbench";

describe("leader workbench validation", () => {
  test("manual follow-up creation requires summaryNote and allows an empty owner", () => {
    expect(() =>
      createManualFollowUpSchema.parse({
        groupId: "group-1",
        summaryNote: "跟进进度",
      }),
    ).not.toThrow();

    expect(() =>
      createManualFollowUpSchema.parse({
        groupId: "group-1",
        summaryNote: "    ",
      }),
    ).toThrow();

    expect(() =>
      createManualFollowUpSchema.parse({
        groupId: "group-1",
        summaryNote: "再跟进",
        currentOwnerUserId: "",
      }),
    ).not.toThrow();
  });

  test("follow-up reassignment requires followUpItemId and reason", () => {
    expect(() =>
      reassignFollowUpSchema.parse({
        followUpItemId: "item-1",
        nextOwnerUserId: "member-1",
        reason: "重新安排",
      }),
    ).not.toThrow();

    const missingFollowUpItem = reassignFollowUpSchema.safeParse({
      nextOwnerUserId: "member-1",
      reason: "重新安排",
    });

    expect(missingFollowUpItem.success).toBe(false);
    expect(
      missingFollowUpItem.error?.issues.some((issue) =>
        issue.path.includes("followUpItemId"),
      ),
    ).toBe(true);

    const whitespaceReason = reassignFollowUpSchema.safeParse({
      followUpItemId: "item-1",
      nextOwnerUserId: "member-1",
      reason: "  ",
    });

    expect(whitespaceReason.success).toBe(false);

  });

  test("follow-up reassignment allows clearing nextOwnerUserId for the group pool", () => {
    const withoutOwner = reassignFollowUpSchema.parse({
      followUpItemId: "item-1",
      reason: "重新安排",
    });

    expect(withoutOwner.nextOwnerUserId).toBeUndefined();

    const whitespaceOwner = reassignFollowUpSchema.parse({
      followUpItemId: "item-1",
      nextOwnerUserId: "   ",
      reason: "重新安排",
    });

    expect(whitespaceOwner.nextOwnerUserId).toBeUndefined();
  });

  test("reassign follow-up trims owner and reason", () => {
    const parsed = reassignFollowUpSchema.parse({
      followUpItemId: "item-1",
      nextOwnerUserId: " member-1  ",
      reason: "  重新安排  ",
    });

    expect(parsed.nextOwnerUserId).toBe("member-1");
    expect(parsed.reason).toBe("重新安排");
  });

  test("follow-up status updates require followUpItemId, status, and reason", () => {
    expect(() =>
      updateFollowUpStatusSchema.parse({
        followUpItemId: "item-1",
        status: "FOLLOWING_UP",
        reason: "客户在学校",
      }),
    ).not.toThrow();

    expect(() =>
      updateFollowUpStatusSchema.parse({
        status: "FOLLOWING_UP",
        reason: "客户在学校",
      }),
    ).toThrow();

    expect(() =>
      updateFollowUpStatusSchema.parse({
        followUpItemId: "item-1",
        reason: "客户在学校",
      }),
    ).toThrow();

    expect(() =>
      updateFollowUpStatusSchema.parse({
        followUpItemId: "item-1",
        status: "FOLLOWING_UP",
        reason: "   ",
      }),
    ).toThrow();
  });

  test("update follow-up status trims reason", () => {
    const parsed = updateFollowUpStatusSchema.parse({
      followUpItemId: "item-1",
      status: "READY_TO_CONVERT",
      reason: "  状态更新  ",
    });

    expect(parsed.reason).toBe("状态更新");
  });

  test("code reassignment allows an empty nextOwnerUserId but still requires a reason", () => {
    expect(() =>
      reassignIdentifierCodeSchema.parse({
        codeId: "code-1",
        nextOwnerUserId: undefined,
        reason: "回收到组池",
      }),
    ).not.toThrow();

    expect(() =>
      reassignIdentifierCodeSchema.parse({
        codeId: "code-1",
        nextOwnerUserId: "   ",
        reason: "回收到组池",
      }),
    ).not.toThrow();

    expect(() =>
      reassignIdentifierCodeSchema.parse({
        codeId: "code-1",
        reason: "",
      }),
    ).toThrow();
  });

  test("reassign identifier code trims reason", () => {
    const parsed = reassignIdentifierCodeSchema.parse({
      codeId: "code-1",
      nextOwnerUserId: "",
      reason: "  组池回收  ",
    });

    expect(parsed.reason).toBe("组池回收");
  });
});
