import { z } from "zod";

export const salesSchema = z.object({
  saleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效日期"),
  count40: z.coerce.number().int().min(0, "40 套餐数量不能小于 0"),
  count60: z.coerce.number().int().min(0, "60 套餐数量不能小于 0"),
  remark: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

export const salesRecordUpdateSchema = z.object({
  id: z.string().min(1, "销售记录 ID 缺失"),
  count40: z.coerce.number().int().min(0, "40 套餐数量不能小于 0"),
  count60: z.coerce.number().int().min(0, "60 套餐数量不能小于 0"),
  remark: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().max(200, "备注不能超过 200 个字符").optional(),
  ),
  returnTo: z.string().default("/admin/sales"),
});

export type SalesInput = {
  saleDate: unknown;
  count40: unknown;
  count60: unknown;
  remark?: unknown;
};

export type SalesValues = z.infer<typeof salesSchema>;
export type SalesRecordUpdateInput = z.infer<typeof salesRecordUpdateSchema>;
