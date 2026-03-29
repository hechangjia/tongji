import { z } from "zod";

const summaryNoteSchema = z.string().trim().min(1, "请填写跟进摘要");
const codeIdSchema = z.string().trim().min(1, "请选择识别码");
const followUpItemIdSchema = z.string().trim().min(1, "请选择跟进项");
const reasonSchema = z.string().trim().min(1, "请输入理由");
const followUpStatusSchema = z.enum(
  ["UNTOUCHED", "FOLLOWING_UP", "APPOINTED", "READY_TO_CONVERT", "INVALID"] as const,
  {
    message: "请选择跟进状态",
  },
);

const optionalUserIdSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const createManualFollowUpSchema = z
  .object({
    summaryNote: summaryNoteSchema,
    currentOwnerUserId: optionalUserIdSchema,
  })
  .strip();

export const reassignFollowUpSchema = z.object({
  followUpItemId: followUpItemIdSchema,
  nextOwnerUserId: optionalUserIdSchema,
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
