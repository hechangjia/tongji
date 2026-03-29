import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const refreshLeaderWorkbenchCachesMock = vi.hoisted(() => vi.fn());
const createManualFollowUpForLeaderMock = vi.hoisted(() => vi.fn());
const reassignFollowUpForLeaderMock = vi.hoisted(() => vi.fn());
const updateFollowUpStatusForLeaderMock = vi.hoisted(() => vi.fn());
const reassignIdentifierCodeForLeaderMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/server/services/leader-workbench-service", () => ({
  createManualFollowUpForLeader: createManualFollowUpForLeaderMock,
  reassignFollowUpForLeader: reassignFollowUpForLeaderMock,
  updateFollowUpStatusForLeader: updateFollowUpStatusForLeaderMock,
  reassignIdentifierCodeForLeader: reassignIdentifierCodeForLeaderMock,
}));

import {
  createManualFollowUpAction,
  reassignFollowUpAction,
  reassignIdentifierCodeAction,
} from "@/app/(leader)/leader/sales/actions";

describe("leader sales actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "leader-1",
        role: "LEADER",
        username: "leader01",
        name: "组长一号",
      },
    });
  });

  test("creating a manual follow-up redirects back with a success notice", async () => {
    createManualFollowUpForLeaderMock.mockResolvedValue({
      id: "follow-1",
      currentOwnerUserId: "member-1",
    });

    const formData = new FormData();
    formData.set("summaryNote", "主动发现一个数学新生");
    formData.set("currentOwnerUserId", "member-1");

    await expect(createManualFollowUpAction(formData)).rejects.toThrow(
      "redirect:/leader/sales?notice=%E5%B7%B2%E6%96%B0%E5%A2%9E%E8%B7%9F%E8%BF%9B%E9%A1%B9&noticeTone=success",
    );

    expect(createManualFollowUpForLeaderMock).toHaveBeenCalledWith("leader-1", {
      summaryNote: "主动发现一个数学新生",
      currentOwnerUserId: "member-1",
    });
    expect(refreshLeaderWorkbenchCachesMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/leader/group");
    expect(revalidatePathMock).toHaveBeenCalledWith("/entry");
  });

  test("reassigning a follow-up item refreshes the workbench and leaderboard pages", async () => {
    reassignFollowUpForLeaderMock.mockResolvedValue({
      id: "follow-1",
      currentOwnerUserId: "member-2",
    });

    const formData = new FormData();
    formData.set("followUpItemId", "follow-1");
    formData.set("nextOwnerUserId", "member-2");
    formData.set("reason", "成员乙接手");

    await expect(reassignFollowUpAction(formData)).rejects.toThrow(
      "redirect:/leader/sales?notice=%E8%B7%9F%E8%BF%9B%E9%A1%B9%E5%B7%B2%E6%9B%B4%E6%96%B0&noticeTone=success",
    );

    expect(refreshLeaderWorkbenchCachesMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/leader/group");
    expect(revalidatePathMock).toHaveBeenCalledWith("/entry");
  });

  test("reassigning a code back to the group pool succeeds with a required reason", async () => {
    reassignIdentifierCodeForLeaderMock.mockResolvedValue({
      id: "code-1",
      currentOwnerUserId: null,
    });

    const formData = new FormData();
    formData.set("codeId", "code-1");
    formData.set("nextOwnerUserId", "");
    formData.set("reason", "回收到组池");

    await expect(reassignIdentifierCodeAction(formData)).rejects.toThrow(
      "redirect:/leader/sales?notice=%E8%AF%86%E5%88%AB%E7%A0%81%E5%B7%B2%E6%9B%B4%E6%96%B0&noticeTone=success",
    );

    expect(reassignIdentifierCodeForLeaderMock).toHaveBeenCalledWith("leader-1", {
      codeId: "code-1",
      nextOwnerUserId: "",
      reason: "回收到组池",
    });
  });

  test("unauthenticated or non-leader callers redirect away", async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(createManualFollowUpAction(new FormData())).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fleader%2Fsales",
    );

    authMock.mockResolvedValueOnce({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
      },
    });

    await expect(reassignFollowUpAction(new FormData())).rejects.toThrow("redirect:/entry");
  });
});
