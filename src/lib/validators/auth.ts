import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码"),
  callbackUrl: z.string().optional(),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "账号至少需要 3 个字符")
    .max(24, "账号不能超过 24 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线"),
  password: z.string().min(8, "密码至少需要 8 个字符"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
