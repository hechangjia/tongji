import { z } from "zod";

export const dailyTargetAdjustSchema = z.object({
  targetId: z.string().min(1, "目标 ID 缺失"),
  finalTotal: z.coerce.number().int().min(0, "今日目标不能小于 0"),
  returnTo: z.string().default("/admin/insights"),
});

export type DailyTargetAdjustInput = z.infer<typeof dailyTargetAdjustSchema>;
