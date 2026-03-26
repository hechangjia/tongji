import { z } from "zod";

export const settlementQuerySchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择开始日期"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择结束日期"),
  })
  .refine(
    (value) =>
      new Date(`${value.endDate}T00:00:00.000Z`).getTime() >=
      new Date(`${value.startDate}T00:00:00.000Z`).getTime(),
    {
      message: "结束日期不能早于开始日期",
      path: ["endDate"],
    },
  );

export type SettlementQueryInput = z.infer<typeof settlementQuerySchema>;
