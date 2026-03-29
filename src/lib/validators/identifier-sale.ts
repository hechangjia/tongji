import { z } from "zod";

const codeIdSchema = z.string().trim().min(1, "请选择识别码");
const saleDateSchema = z.string().trim().min(1, "请选择成交日期");
const planTypeSchema = z.enum(["PLAN_40", "PLAN_60"], {
  message: "请选择套餐类型",
});
const followUpItemIdSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();
const remarkSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "")
  .refine((value) => value.length <= 200, {
    message: "备注不能超过 200 个字符",
  })
  .transform((value) => value || undefined);

const assignedLeadSchema = z
  .object({
    codeId: codeIdSchema,
    planType: planTypeSchema,
    saleDate: saleDateSchema,
    sourceMode: z.literal("ASSIGNED_LEAD"),
    prospectLeadId: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? "")
      .refine((value) => value.length > 0, {
        message: "请选择已分配的新生线索",
      }),
    qqNumber: z.string().optional(),
    major: z.string().optional(),
    remark: remarkSchema,
    followUpItemId: followUpItemIdSchema,
  })
  .superRefine((value, context) => {
    if ((value.qqNumber?.trim() ?? "") || (value.major?.trim() ?? "")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "已分配线索模式下不能再填写手动 QQ 信息",
        path: ["qqNumber"],
      });
    }
  });

const manualInputSchema = z
  .object({
    codeId: codeIdSchema,
    planType: planTypeSchema,
    saleDate: saleDateSchema,
    sourceMode: z.literal("MANUAL_INPUT"),
    prospectLeadId: z.string().optional(),
    qqNumber: z.string().trim().min(1, "请输入 QQ 号"),
    major: z.string().trim().min(1, "请输入专业"),
    remark: remarkSchema,
    followUpItemId: followUpItemIdSchema,
  })
  .superRefine((value, context) => {
    if ((value.prospectLeadId?.trim() ?? "") !== "") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "手动录入模式下不能选择已分配线索",
        path: ["prospectLeadId"],
      });
    }
  });

export const identifierSaleSchema = z.discriminatedUnion("sourceMode", [
  assignedLeadSchema,
  manualInputSchema,
]);
