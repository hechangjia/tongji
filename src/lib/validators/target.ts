import { z } from "zod";

function optionalStringField(errorMessage: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length > 0 ? value : undefined),
    z.string().trim().min(1, errorMessage).optional(),
  );
}

export const dailyTargetAdjustSchema = z.object({
  targetId: optionalStringField("目标 ID 缺失"),
  userId: optionalStringField("成员 ID 缺失"),
  targetDate: optionalStringField("目标日期缺失"),
  finalTotal: z.coerce.number().int().min(0, "今日目标不能小于 0"),
  returnTo: z.string().default("/admin/insights"),
}).superRefine((input, context) => {
  if (!input.targetId && !(input.userId && input.targetDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "目标上下文缺失",
      path: ["targetId"],
    });
  }
});

export type DailyTargetAdjustInput = z.infer<typeof dailyTargetAdjustSchema>;
