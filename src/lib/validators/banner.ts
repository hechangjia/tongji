import { z } from "zod";

const contentStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const bannerSourceTypeSchema = z.enum(["BUILTIN", "CUSTOM"]);
const bannerDisplayModeSchema = z.enum(["RANDOM", "ROTATE"]);

const checkboxBooleanSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "on" || value === "true");

export const bannerQuoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "请输入横幅文案")
    .max(120, "横幅文案不能超过 120 个字符"),
  author: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ""),
  sourceType: bannerSourceTypeSchema,
  status: contentStatusSchema,
});

export const bannerSettingsSchema = z.object({
  displayMode: bannerDisplayModeSchema,
  isEnabled: checkboxBooleanSchema,
});

export type BannerQuoteInput = z.infer<typeof bannerQuoteSchema>;
export type BannerSettingsInput = z.infer<typeof bannerSettingsSchema>;
