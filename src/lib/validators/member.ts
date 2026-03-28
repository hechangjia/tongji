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

const roleSchema = z.enum(["ADMIN", "LEADER", "MEMBER"]);

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

const optionalGroupIdSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "")
  .transform((value) => value || undefined);

export const memberSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  password: z.string().min(8, "密码至少需要 8 个字符"),
  groupId: optionalGroupIdSchema,
  remark: optionalTrimmedString(200, "备注不能超过 200 个字符"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const memberUpdateSchema = z
  .object({
    id: z.string().min(1, "成员 ID 缺失"),
    username: usernameSchema,
    name: nameSchema,
    role: roleSchema,
    groupId: optionalGroupIdSchema,
    remark: optionalTrimmedString(200, "备注不能超过 200 个字符"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    password: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? "")
      .refine((value) => value === "" || value.length >= 8, {
        message: "新密码至少需要 8 个字符",
      }),
  })
  .superRefine((value, context) => {
    if (value.role === "LEADER" && !value.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "组长必须绑定所属小组",
        path: ["groupId"],
      });
    }
  });

export const memberProfileUpdateSchema = z.object({
  id: z.string().min(1, "成员 ID 缺失"),
  username: usernameSchema,
  name: nameSchema,
  remark: optionalTrimmedString(200, "备注不能超过 200 个字符"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  password: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => value === "" || value.length >= 8, {
      message: "新密码至少需要 8 个字符",
    }),
});

export const memberAssignmentUpdateSchema = z
  .object({
    id: z.string().min(1, "成员 ID 缺失"),
    role: roleSchema,
    groupId: optionalGroupIdSchema,
  })
  .superRefine((value, context) => {
    if (value.role === "LEADER" && !value.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "组长必须绑定所属小组",
        path: ["groupId"],
      });
    }
  });

export const memberResetPasswordSchema = z.object({
  id: z.string().min(1, "成员 ID 缺失"),
  username: z.string().trim().min(1, "账号缺失"),
});

export const memberDeleteSchema = z.object({
  id: z.string().min(1, "成员 ID 缺失"),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MemberProfileUpdateInput = z.infer<typeof memberProfileUpdateSchema>;
export type MemberAssignmentUpdateInput = z.infer<typeof memberAssignmentUpdateSchema>;
