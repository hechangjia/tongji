"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultRedirectPath } from "@/lib/permissions";
import { refreshLeaderWorkbenchCaches } from "@/server/services/leaderboard-cache";
import {
  createManualFollowUpForLeader,
  reassignFollowUpForLeader,
  reassignIdentifierCodeForLeader,
  updateFollowUpStatusForLeader,
} from "@/server/services/leader-workbench-service";

function appendNotice(notice: string, tone: "success" | "error" = "success") {
  return `/leader/sales?notice=${encodeURIComponent(notice)}&noticeTone=${tone}`;
}

async function requireLeaderSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fleader%2Fsales");
  }

  if (session.user.role !== "LEADER") {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  return session;
}

function refreshLeaderWorkbenchPageState() {
  refreshLeaderWorkbenchCaches();
  revalidatePath("/leader/group");
  revalidatePath("/entry");
}

function pickErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试";
}

export async function createManualFollowUpAction(formData: FormData) {
  const session = await requireLeaderSession();
  let destination = appendNotice("已新增跟进项");

  try {
    await createManualFollowUpForLeader(session.user.id, {
      summaryNote: String(formData.get("summaryNote") ?? ""),
      currentOwnerUserId: String(formData.get("currentOwnerUserId") ?? ""),
    });

    refreshLeaderWorkbenchPageState();
  } catch (error) {
    destination = appendNotice(pickErrorMessage(error), "error");
  }

  redirect(destination);
}

export async function reassignFollowUpAction(formData: FormData) {
  const session = await requireLeaderSession();
  let destination = appendNotice("跟进项已更新");

  try {
    await reassignFollowUpForLeader(session.user.id, {
      followUpItemId: String(formData.get("followUpItemId") ?? ""),
      nextOwnerUserId: String(formData.get("nextOwnerUserId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });

    refreshLeaderWorkbenchPageState();
  } catch (error) {
    destination = appendNotice(pickErrorMessage(error), "error");
  }

  redirect(destination);
}

export async function updateFollowUpStatusAction(formData: FormData) {
  const session = await requireLeaderSession();
  let destination = appendNotice("跟进状态已更新");

  try {
    await updateFollowUpStatusForLeader(session.user.id, {
      followUpItemId: String(formData.get("followUpItemId") ?? ""),
      status: String(formData.get("status") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });

    refreshLeaderWorkbenchPageState();
  } catch (error) {
    destination = appendNotice(pickErrorMessage(error), "error");
  }

  redirect(destination);
}

export async function reassignIdentifierCodeAction(formData: FormData) {
  const session = await requireLeaderSession();
  let destination = appendNotice("识别码已更新");

  try {
    await reassignIdentifierCodeForLeader(session.user.id, {
      codeId: String(formData.get("codeId") ?? ""),
      nextOwnerUserId: String(formData.get("nextOwnerUserId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });

    refreshLeaderWorkbenchPageState();
  } catch (error) {
    destination = appendNotice(pickErrorMessage(error), "error");
  }

  redirect(destination);
}
