import { z } from "zod";

export const commissionRuleSchema = z
  .object({
    userId: z.string().min(1, "请选择成员"),
    price40: z.coerce.number().min(0, "40 套餐卡酬不能小于 0"),
    price60: z.coerce.number().min(0, "60 套餐卡酬不能小于 0"),
    effectiveStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择生效开始日期"),
    effectiveEnd: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .optional()
      .transform((value) => value || undefined),
  })
  .refine(
    (value) =>
      !value.effectiveEnd ||
      new Date(`${value.effectiveEnd}T00:00:00.000Z`).getTime() >=
        new Date(`${value.effectiveStart}T00:00:00.000Z`).getTime(),
    {
      message: "结束日期不能早于开始日期",
      path: ["effectiveEnd"],
    },
  );

export type CommissionRuleInput = z.infer<typeof commissionRuleSchema>;
