import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userCreateMock = vi.hoisted(() => vi.fn());
const userDeleteMock = vi.hoisted(() => vi.fn());
const userUpdateMock = vi.hoisted(() => vi.fn());
const userUpdateManyMock = vi.hoisted(() => vi.fn());
const groupFindUniqueMock = vi.hoisted(() => vi.fn());
const groupUpdateMock = vi.hoisted(() => vi.fn());
const dbTransactionMock = vi.hoisted(() => vi.fn());
const hashPasswordMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbTransactionMock,
    user: {
      create: userCreateMock,
      delete: userDeleteMock,
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
      updateMany: userUpdateManyMock,
    },
    group: {
      findUnique: groupFindUniqueMock,
      update: groupUpdateMock,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: hashPasswordMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

import {
  createMemberAction,
  deleteMemberAction,
  updateMemberAction,
} from "@/app/(admin)/admin/members/actions";

describe("member create action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("creates a member with optional group and remark", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
    });
    userCreateMock.mockResolvedValue({});
    hashPasswordMock.mockResolvedValue("hashed-password");

    const formData = new FormData();
    formData.set("username", "member01");
    formData.set("name", "成员1");
    formData.set("password", "member123456");
    formData.set("groupId", "group-1");
    formData.set("remark", "负责新生点位");
    formData.set("status", "ACTIVE");

    await expect(createMemberAction(undefined, formData)).resolves.toEqual({
      status: "success",
      message: "成员创建成功",
      values: {
        username: "",
        name: "",
        password: "",
        groupId: "",
        remark: "",
        status: "ACTIVE",
      },
    });

    expect(userCreateMock).toHaveBeenCalledWith({
      data: {
        username: "member01",
        name: "成员1",
        passwordHash: "hashed-password",
        role: "MEMBER",
        groupId: "group-1",
        remark: "负责新生点位",
        status: "ACTIVE",
      },
    });
  });

  test("rejects create payloads with a missing group", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    groupFindUniqueMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("username", "member01");
    formData.set("name", "成员1");
    formData.set("password", "member123456");
    formData.set("groupId", "group-missing");
    formData.set("remark", "负责新生点位");
    formData.set("status", "ACTIVE");

    await expect(createMemberAction(undefined, formData)).resolves.toEqual({
      status: "error",
      message: "所选小组不存在，请刷新页面后重试",
      values: {
        username: "member01",
        name: "成员1",
        password: "",
        groupId: "group-missing",
        remark: "负责新生点位",
        status: "ACTIVE",
      },
    });

    expect(userCreateMock).not.toHaveBeenCalled();
  });
});

describe("member update action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    dbTransactionMock.mockImplementation(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    );
  });

  test("promotes a member to leader and syncs group assignment", async () => {
    userFindUniqueMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ role: "MEMBER", groupId: null, ledGroup: null });
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderUserId: "leader-old",
    });
    userUpdateMock.mockResolvedValue({});
    userUpdateManyMock.mockResolvedValue({ count: 1 });
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("username", "member01");
    formData.set("name", "成员1");
    formData.set("role", "LEADER");
    formData.set("groupId", "group-1");
    formData.set("remark", "负责新生点位");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E6%88%90%E5%91%98%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0",
    );

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { username: "member01" },
      select: { id: true },
    });
    expect(userUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "leader-old",
        role: "LEADER",
      },
      data: {
        role: "MEMBER",
      },
    });
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: {
        username: "member01",
        name: "成员1",
        role: "LEADER",
        groupId: "group-1",
        remark: "负责新生点位",
        status: "ACTIVE",
      },
    });
    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        leaderUserId: "member-1",
      },
    });
    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("updates profile fields without overwriting role or group", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    userUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("username", "member_profile");
    formData.set("name", "新名字");
    formData.set("remark", "更新备注");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E6%88%90%E5%91%98%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0&noticeTone=success",
    );

    expect(groupFindUniqueMock).not.toHaveBeenCalled();
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: {
        username: "member_profile",
        name: "新名字",
        remark: "更新备注",
        status: "ACTIVE",
      },
    });
  });

  test("updates role and group without overwriting profile fields", async () => {
    userFindUniqueMock.mockResolvedValue({
      role: "MEMBER",
      groupId: null,
      ledGroup: null,
    });
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderUserId: null,
    });
    userUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("role", "MEMBER");
    formData.set("groupId", "group-1");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E6%88%90%E5%91%98%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0&noticeTone=success",
    );

    expect(userFindUniqueMock).toHaveBeenCalledTimes(1);
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: {
        role: "MEMBER",
        groupId: "group-1",
      },
    });
  });

  test("rejects non-leader updates with a missing group", async () => {
    userFindUniqueMock.mockResolvedValue({
      role: "MEMBER",
      groupId: null,
      ledGroup: null,
    });
    groupFindUniqueMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("role", "MEMBER");
    formData.set("groupId", "group-missing");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E6%89%80%E9%80%89%E5%B0%8F%E7%BB%84%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%8C%E8%AF%B7%E5%88%B7%E6%96%B0%E9%A1%B5%E9%9D%A2%E5%90%8E%E9%87%8D%E8%AF%95&noticeTone=error",
    );

    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  test("rejects duplicate usernames owned by another user", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "member-2" });

    const formData = new FormData();
    formData.set("id", "admin-1");
    formData.set("username", "taken_name");
    formData.set("name", "系统管理员");
    formData.set("role", "ADMIN");
    formData.set("groupId", "");
    formData.set("remark", "");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E8%AF%A5%E8%B4%A6%E5%8F%B7%E5%B7%B2%E5%AD%98%E5%9C%A8%EF%BC%8C%E8%AF%B7%E6%9B%B4%E6%8D%A2%E5%90%8E%E9%87%8D%E8%AF%95&noticeTone=error",
    );

    expect(userUpdateMock).not.toHaveBeenCalled();
    expect(refreshLeaderboardCachesMock).not.toHaveBeenCalled();
  });

  test("rejects promoting a leader without a group", async () => {
    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("username", "member01");
    formData.set("name", "成员1");
    formData.set("role", "LEADER");
    formData.set("groupId", "");
    formData.set("remark", "负责新生点位");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E7%BB%84%E9%95%BF%E5%BF%85%E9%A1%BB%E7%BB%91%E5%AE%9A%E6%89%80%E5%B1%9E%E5%B0%8F%E7%BB%84&noticeTone=error",
    );

    expect(userUpdateMock).not.toHaveBeenCalled();
    expect(groupUpdateMock).not.toHaveBeenCalled();
  });

  test("rejects demoting the current admin away from ADMIN", async () => {
    const formData = new FormData();
    formData.set("id", "admin-1");
    formData.set("username", "admin_1");
    formData.set("name", "系统管理员");
    formData.set("role", "MEMBER");
    formData.set("groupId", "");
    formData.set("remark", "");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E4%B8%8D%E8%83%BD%E5%B0%86%E5%BD%93%E5%89%8D%E7%99%BB%E5%BD%95%E7%AE%A1%E7%90%86%E5%91%98%E9%99%8D%E7%BA%A7&noticeTone=error",
    );

    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(userUpdateMock).not.toHaveBeenCalled();
    expect(refreshLeaderboardCachesMock).not.toHaveBeenCalled();
  });
});

describe("member delete action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("rejects deleting the current logged-in admin", async () => {
    const formData = new FormData();
    formData.set("id", "admin-1");

    await expect(deleteMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E4%B8%8D%E8%83%BD%E5%88%A0%E9%99%A4%E5%BD%93%E5%89%8D%E7%99%BB%E5%BD%95%E7%AE%A1%E7%90%86%E5%91%98&noticeTone=error",
    );

    expect(userDeleteMock).not.toHaveBeenCalled();
  });

  test("rejects deleting a member with history data", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      ledGroup: null,
      _count: {
        salesRecords: 1,
        commissionRules: 0,
        dailyTargets: 0,
        adjustedDailyTargets: 0,
        receivedReminders: 0,
        sentReminders: 0,
        identifierImportBatches: 0,
        importedProspectBatches: 0,
        ownedIdentifierCodes: 0,
        receivedCodeAssignments: 0,
        sentCodeAssignments: 0,
        assignedProspectLeads: 0,
        createdProspectLeads: 0,
        identifierSales: 0,
      },
    });

    const formData = new FormData();
    formData.set("id", "member-1");

    await expect(deleteMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E8%AF%A5%E6%88%90%E5%91%98%E5%B7%B2%E6%9C%89%E5%8E%86%E5%8F%B2%E6%95%B0%E6%8D%AE%EF%BC%8C%E4%B8%8D%E8%83%BD%E7%9B%B4%E6%8E%A5%E5%88%A0%E9%99%A4%EF%BC%8C%E8%AF%B7%E6%94%B9%E4%B8%BA%E5%81%9C%E7%94%A8&noticeTone=error",
    );

    expect(userDeleteMock).not.toHaveBeenCalled();
  });

  test("deletes a member without history data", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "member-1",
      ledGroup: null,
      _count: {
        salesRecords: 0,
        commissionRules: 0,
        dailyTargets: 0,
        adjustedDailyTargets: 0,
        receivedReminders: 0,
        sentReminders: 0,
        identifierImportBatches: 0,
        importedProspectBatches: 0,
        ownedIdentifierCodes: 0,
        receivedCodeAssignments: 0,
        sentCodeAssignments: 0,
        assignedProspectLeads: 0,
        createdProspectLeads: 0,
        identifierSales: 0,
      },
    });
    userDeleteMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "member-1");

    await expect(deleteMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=%E6%88%90%E5%91%98%E5%B7%B2%E5%88%A0%E9%99%A4&noticeTone=success",
    );

    expect(userDeleteMock).toHaveBeenCalledWith({
      where: { id: "member-1" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/members");
    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });
});
