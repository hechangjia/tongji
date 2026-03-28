"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import {
  assignIdentifierCodesToUser,
  assignProspectLeadsToUser,
  importIdentifierCodes,
  importProspectLeads,
} from "@/server/services/admin-code-service";
import {
  identifierAssignmentSchema,
  identifierUploadSchema,
  prospectAssignmentSchema,
  prospectUploadSchema,
} from "@/lib/validators/codes";
import type { CodesImportFormState } from "@/app/(admin)/admin/codes/form-state";

function appendNotice(notice: string, tone: "success" | "error" = "success") {
  return `/admin/codes?notice=${encodeURIComponent(notice)}&noticeTone=${tone}`;
}

async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fcodes");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

export async function importIdentifierCodesAction(
  _previousState: CodesImportFormState | undefined,
  formData: FormData,
): Promise<CodesImportFormState> {
  const session = await requireAdminSession();

  try {
    const parsedInput = identifierUploadSchema.parse({
      file: formData.get("file"),
    });
    const result = await importIdentifierCodes({
      file: parsedInput.file,
      importedByUserId: session.user.id,
    });

    revalidatePath("/admin/codes");

    return {
      status: "success",
      message: `识别码导入完成：新增 ${result.successCount} 条，跳过 ${result.skippedCount} 条`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "识别码导入失败，请稍后重试",
    };
  }
}

export async function importProspectLeadsAction(
  _previousState: CodesImportFormState | undefined,
  formData: FormData,
): Promise<CodesImportFormState> {
  const session = await requireAdminSession();

  try {
    const parsedInput = prospectUploadSchema.parse({
      file: formData.get("file"),
    });
    const result = await importProspectLeads({
      file: parsedInput.file,
      importedByUserId: session.user.id,
    });

    revalidatePath("/admin/codes");

    return {
      status: "success",
      message: `新生 QQ 导入完成：新增 ${result.successCount} 条，跳过 ${result.skippedCount} 条`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "新生 QQ 导入失败，请稍后重试",
    };
  }
}

export async function assignIdentifierCodesAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsedInput = identifierAssignmentSchema.parse({
    userId: formData.get("userId"),
    codeIds: formData.getAll("codeIds"),
  });

  await assignIdentifierCodesToUser({
    codeIds: parsedInput.codeIds,
    userId: parsedInput.userId,
    assignedByUserId: session.user.id,
    remark: null,
  });

  revalidatePath("/admin/codes");
  redirect(appendNotice(`识别码已分发 ${parsedInput.codeIds.length} 条`));
}

export async function assignProspectLeadsAction(formData: FormData) {
  await requireAdminSession();
  const parsedInput = prospectAssignmentSchema.parse({
    userId: formData.get("userId"),
    leadIds: formData.getAll("leadIds"),
  });

  await assignProspectLeadsToUser({
    leadIds: parsedInput.leadIds,
    userId: parsedInput.userId,
  });

  revalidatePath("/admin/codes");
  redirect(appendNotice(`新生线索已分配 ${parsedInput.leadIds.length} 条`));
}
