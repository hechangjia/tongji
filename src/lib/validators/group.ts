import { z } from "zod";

const groupNameSchema = z
  .string()
  .trim()
  .min(1, "请输入小组名称")
  .max(32, "小组名称不能超过 32 个字符");

function optionalTrimmedString(maxLength: number, errorMessage: string) {
  return z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => value.length <= maxLength, {
      message: errorMessage,
    })
    .transform((value) => value || undefined);
}

const optionalLeaderIdSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "")
  .transform((value) => value || undefined);

export const groupSchema = z.object({
  name: groupNameSchema,
  slogan: optionalTrimmedString(80, "小组口号不能超过 80 个字符"),
  remark: optionalTrimmedString(200, "备注不能超过 200 个字符"),
  leaderUserId: optionalLeaderIdSchema,
});

export const groupUpdateSchema = z.object({
  id: z.string().min(1, "小组 ID 缺失"),
  name: groupNameSchema.optional(),
  slogan: optionalTrimmedString(80, "小组口号不能超过 80 个字符"),
  remark: optionalTrimmedString(200, "备注不能超过 200 个字符"),
  leaderUserId: optionalLeaderIdSchema,
});

export type GroupInput = z.infer<typeof groupSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
