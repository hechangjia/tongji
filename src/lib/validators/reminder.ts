import { z } from "zod";

export const reminderTemplateSchema = z.enum([
  "TARGET_GAP",
  "MISSING_SUBMISSION",
  "FOLLOW_UP",
  "CUSTOM",
]);

export const memberReminderSchema = z.object({
  userId: z.string().min(1, "成员 ID 缺失"),
  template: reminderTemplateSchema,
  title: z
    .string()
    .trim()
    .min(1, "提醒标题不能为空")
    .max(60, "提醒标题不能超过 60 个字符"),
  content: z
    .string()
    .trim()
    .min(1, "提醒内容不能为空")
    .max(300, "提醒内容不能超过 300 个字符"),
  returnTo: z.string().default("/admin/insights"),
});

export type ReminderTemplate = z.infer<typeof reminderTemplateSchema>;
export type MemberReminderInput = z.infer<typeof memberReminderSchema>;
