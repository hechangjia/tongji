import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "账号至少需要 3 个字符")
  .max(24, "账号不能超过 24 个字符")
  .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线");

const nameSchema = z
  .string()
  .trim()
  .min(1, "请输入成员姓名")
  .max(32, "姓名不能超过 32 个字符");

export const memberSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  password: z.string().min(8, "密码至少需要 8 个字符"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const memberUpdateSchema = z.object({
  id: z.string().min(1, "成员 ID 缺失"),
  username: usernameSchema,
  name: nameSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]),
  password: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => value === "" || value.length >= 8, {
      message: "新密码至少需要 8 个字符",
    }),
});

export const memberResetPasswordSchema = z.object({
  id: z.string().min(1, "成员 ID 缺失"),
  username: z.string().trim().min(1, "账号缺失"),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
