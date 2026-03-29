import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const refreshLeaderWorkbenchCachesMock = vi.hoisted(() => vi.fn());
const importIdentifierCodesMock = vi.hoisted(() => vi.fn());
const importProspectLeadsMock = vi.hoisted(() => vi.fn());
const assignIdentifierCodesToUserMock = vi.hoisted(() => vi.fn());
const assignProspectLeadsToUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderWorkbenchCaches: refreshLeaderWorkbenchCachesMock,
}));

vi.mock("@/server/services/admin-code-service", () => ({
  importIdentifierCodes: importIdentifierCodesMock,
  importProspectLeads: importProspectLeadsMock,
  assignIdentifierCodesToUser: assignIdentifierCodesToUserMock,
  assignProspectLeadsToUser: assignProspectLeadsToUserMock,
}));

import {
  assignIdentifierCodesAction,
  assignProspectLeadsAction,
  importIdentifierCodesAction,
  importProspectLeadsAction,
} from "@/app/(admin)/admin/codes/actions";

describe("admin codes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("imports identifier codes and returns a success state", async () => {
    importIdentifierCodesMock.mockResolvedValue({
      batchId: "batch-1",
      successCount: 3,
      skippedCount: 1,
    });

    const formData = new FormData();
    formData.set(
      "file",
      new File(["code"], "codes.csv", {
        type: "text/csv",
      }),
    );

    await expect(importIdentifierCodesAction(undefined, formData)).resolves.toEqual({
      status: "success",
      message: "识别码导入完成：新增 3 条，跳过 1 条",
    });

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/codes");
  });

  test("returns a friendly error when prospect import fails", async () => {
    importProspectLeadsMock.mockRejectedValue(new Error("上传文件缺少“专业”列"));

    const formData = new FormData();
    formData.set(
      "file",
      new File(["qq"], "prospects.csv", {
        type: "text/csv",
      }),
    );

    await expect(importProspectLeadsAction(undefined, formData)).resolves.toEqual({
      status: "error",
      message: "上传文件缺少“专业”列",
    });
  });

  test("assigns identifier codes and redirects with a success notice", async () => {
    assignIdentifierCodesToUserMock.mockResolvedValue({
      assignedCount: 2,
    });

    const formData = new FormData();
    formData.set("userId", "member-1");
    formData.append("codeIds", "code-1");
    formData.append("codeIds", "code-2");

    await expect(assignIdentifierCodesAction(formData)).rejects.toThrow(
      "redirect:/admin/codes?notice=",
    );

    expect(assignIdentifierCodesToUserMock).toHaveBeenCalledWith({
      codeIds: ["code-1", "code-2"],
      userId: "member-1",
      assignedByUserId: "admin-1",
      remark: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/codes");
    expect(refreshLeaderWorkbenchCachesMock).toHaveBeenCalledTimes(1);
  });

  test("assigns prospect leads and redirects with a success notice", async () => {
    assignProspectLeadsToUserMock.mockResolvedValue({
      assignedCount: 2,
    });

    const formData = new FormData();
    formData.set("userId", "member-1");
    formData.append("leadIds", "lead-1");
    formData.append("leadIds", "lead-2");

    await expect(assignProspectLeadsAction(formData)).rejects.toThrow(
      "redirect:/admin/codes?notice=",
    );

    expect(assignProspectLeadsToUserMock).toHaveBeenCalledWith({
      leadIds: ["lead-1", "lead-2"],
      userId: "member-1",
    });
    expect(refreshLeaderWorkbenchCachesMock).toHaveBeenCalledTimes(1);
  });

  test("rejects non-admin users before assignment", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
      },
    });

    const formData = new FormData();
    formData.set("userId", "member-2");
    formData.append("codeIds", "code-1");

    await expect(assignIdentifierCodesAction(formData)).rejects.toThrow("redirect:/entry");

    expect(assignIdentifierCodesToUserMock).not.toHaveBeenCalled();
  });
});
