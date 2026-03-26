"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessMemberArea } from "@/lib/permissions";
import { saveSalesRecordForUser } from "@/server/services/sales-service";
import type { SalesEntryFormState } from "@/app/(member)/entry/form-state";

export async function saveSalesEntryAction(
  _previousState: unknown,
  formData: FormData,
): Promise<SalesEntryFormState> {
  const session = await auth();

  if (!session?.user || !canAccessMemberArea(session.user)) {
    redirect("/login?callbackUrl=%2Fentry");
  }

  try {
    const record = await saveSalesRecordForUser(session.user.id, {
      saleDate: formData.get("saleDate"),
      count40: formData.get("count40"),
      count60: formData.get("count60"),
      remark: formData.get("remark"),
    });

    revalidatePath("/entry");

    return {
      status: "success",
      message: "保存成功",
      values: {
        saleDate: record.saleDate.toISOString().slice(0, 10),
        count40: String(record.count40),
        count60: String(record.count60),
        remark: record.remark ?? "",
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: "error",
        message: error.message,
        values: {
          saleDate: String(formData.get("saleDate") ?? ""),
          count40: String(formData.get("count40") ?? "0"),
          count60: String(formData.get("count60") ?? "0"),
          remark: String(formData.get("remark") ?? ""),
        },
      };
    }

    return {
      status: "error",
      message: "保存失败，请稍后重试",
      values: {
        saleDate: String(formData.get("saleDate") ?? ""),
        count40: String(formData.get("count40") ?? "0"),
        count60: String(formData.get("count60") ?? "0"),
        remark: String(formData.get("remark") ?? ""),
      },
    };
  }
}
