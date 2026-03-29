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

    expect(() =>
      reassignFollowUpSchema.parse({
        nextOwnerUserId: "member-1",
        reason: "重新安排",
      }),
    ).toThrow();

    expect(() =>
      reassignFollowUpSchema.parse({
        followUpItemId: "item-1",
        nextOwnerUserId: "member-1",
        reason: "  ",
      }),
    ).toThrow();

    expect(() =>
      reassignFollowUpSchema.parse({
        followUpItemId: "item-1",
        nextOwnerUserId: "   ",
        reason: "重新安排",
      }),
    ).toThrow();
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
        reason: "",
      }),
    ).toThrow();
  });
});
