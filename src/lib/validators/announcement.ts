import { z } from "zod";

const checkboxBooleanSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "on" || value === "true");

const optionalDateTimeSchema = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)])
  .optional()
  .transform((value) => value || undefined);

export const announcementSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "请输入公告标题")
      .max(80, "公告标题不能超过 80 个字符"),
    content: z
      .string()
      .trim()
      .min(1, "请输入公告内容")
      .max(1000, "公告内容不能超过 1000 个字符"),
    isPinned: checkboxBooleanSchema,
    status: z.enum(["ACTIVE", "INACTIVE"]),
    publishAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "请选择发布时间"),
    expireAt: optionalDateTimeSchema,
  })
  .refine(
    (value) =>
      !value.expireAt ||
      new Date(value.expireAt).getTime() >= new Date(value.publishAt).getTime(),
    {
      message: "过期时间不能早于发布时间",
      path: ["expireAt"],
    },
  );

export type AnnouncementInput = z.infer<typeof announcementSchema>;
