import { z } from "zod";

const groupIdSchema = z.string().trim().min(1, "请选择小组");
const summaryNoteSchema = z.string().trim().min(1, "请填写跟进摘要");
const codeIdSchema = z.string().trim().min(1, "请选择识别码");
const followUpItemIdSchema = z.string().trim().min(1, "请选择跟进项");
const reasonSchema = z.string().trim().min(1, "请输入理由");
const followUpStatusSchema = z.enum(
  [
    "UNTOUCHED",
    "FOLLOWING_UP",
    "APPOINTED",
    "READY_TO_CONVERT",
    "INVALID",
    "CONVERTED",
  ] as const,
  {
    message: "请选择跟进状态",
  },
);

const optionalUserIdSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  });

const destinationOwnerUserIdSchema = z.string().trim().min(1, "请选择接收负责人");

export const createManualFollowUpSchema = z.object({
  groupId: groupIdSchema,
  summaryNote: summaryNoteSchema,
  currentOwnerUserId: optionalUserIdSchema,
});

export const reassignFollowUpSchema = z.object({
  followUpItemId: followUpItemIdSchema,
  nextOwnerUserId: destinationOwnerUserIdSchema,
  reason: reasonSchema,
});

export const updateFollowUpStatusSchema = z.object({
  followUpItemId: followUpItemIdSchema,
  status: followUpStatusSchema,
  reason: reasonSchema,
});

export const reassignIdentifierCodeSchema = z.object({
  codeId: codeIdSchema,
  nextOwnerUserId: optionalUserIdSchema,
  reason: reasonSchema,
});
