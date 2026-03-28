import { z } from "zod";

function isUploadFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

const uploadFileSchema = z
  .custom<File>((value) => isUploadFile(value), {
    message: "请上传文件",
  })
  .refine((file) => file.name.trim().length > 0, {
    message: "上传文件名不能为空",
  });

const targetUserIdSchema = z.string().trim().min(1, "请选择要分配的成员");

const selectedIdsSchema = z.array(z.string().trim().min(1)).min(1, "请至少选择一条记录");

export const identifierUploadSchema = z.object({
  file: uploadFileSchema,
});

export const prospectUploadSchema = z.object({
  file: uploadFileSchema,
});

export const identifierAssignmentSchema = z.object({
  userId: targetUserIdSchema,
  codeIds: selectedIdsSchema,
});

export const prospectAssignmentSchema = z.object({
  userId: targetUserIdSchema,
  leadIds: selectedIdsSchema,
});
