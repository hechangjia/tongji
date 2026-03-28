import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const groupFindManyMock = vi.hoisted(() => vi.fn());
const groupFindUniqueMock = vi.hoisted(() => vi.fn());
const groupCreateMock = vi.hoisted(() => vi.fn());
const groupUpdateMock = vi.hoisted(() => vi.fn());
const userFindManyMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userUpdateMock = vi.hoisted(() => vi.fn());
const dbTransactionMock = vi.hoisted(() => vi.fn());

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
    group: {
      findMany: groupFindManyMock,
      findUnique: groupFindUniqueMock,
      create: groupCreateMock,
      update: groupUpdateMock,
    },
    user: {
      findMany: userFindManyMock,
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
}));

import { createGroupAction, updateGroupAction } from "@/app/(admin)/admin/groups/actions";
import { groupSchema, groupUpdateSchema } from "@/lib/validators/group";
import { listGroupsForAdmin, listLeaderCandidates } from "@/server/services/group-service";

describe("group schema", () => {
  test("groupSchema requires a unique name and optional slogan", () => {
    const parsed = groupSchema.parse({ name: "一组", slogan: "冲刺" });

    expect(parsed.name).toBe("一组");
    expect(parsed.slogan).toBe("冲刺");
  });

  test("groupUpdateSchema accepts optional leader assignment", () => {
    const parsed = groupUpdateSchema.parse({
      id: "group-1",
      name: "一组",
      slogan: "冲刺",
      remark: "",
      leaderUserId: "",
    });

    expect(parsed.id).toBe("group-1");
    expect(parsed.leaderUserId).toBeUndefined();
  });
});

describe("group service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("listGroupsForAdmin returns groups with leader and member count", async () => {
    groupFindManyMock.mockResolvedValue([
      {
        id: "group-1",
        name: "一组",
        slogan: "冲刺",
        remark: "重点组",
        leaderUserId: "leader-1",
        leader: {
          id: "leader-1",
          name: "组长A",
          username: "leader_a",
        },
        _count: {
          members: 3,
        },
        createdAt: new Date("2026-03-27T00:00:00.000Z"),
      },
    ]);

    const result = await listGroupsForAdmin();

    expect(groupFindManyMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: "group-1",
        name: "一组",
        slogan: "冲刺",
        remark: "重点组",
        leaderUserId: "leader-1",
        leader: {
          id: "leader-1",
          name: "组长A",
          username: "leader_a",
        },
        memberCount: 3,
        createdAt: new Date("2026-03-27T00:00:00.000Z"),
      },
    ]);
  });

  test("listLeaderCandidates returns active non-admin candidates with current group context", async () => {
    userFindManyMock.mockResolvedValue([
      {
        id: "member-1",
        name: "成员A",
        username: "member_a",
        role: "MEMBER",
        group: null,
      },
      {
        id: "leader-1",
        name: "组长A",
        username: "leader_a",
        role: "LEADER",
        group: {
          name: "一组",
        },
      },
    ]);

    const result = await listLeaderCandidates();

    expect(userFindManyMock).toHaveBeenCalledTimes(1);
    expect(userFindManyMock).toHaveBeenCalledWith({
      where: {
        status: "ACTIVE",
        NOT: {
          role: "ADMIN",
        },
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });
    expect(result).toEqual([
      {
        id: "member-1",
        name: "成员A",
        username: "member_a",
        role: "MEMBER",
        groupName: null,
      },
      {
        id: "leader-1",
        name: "组长A",
        username: "leader_a",
        role: "LEADER",
        groupName: "一组",
      },
    ]);
  });
});

describe("group actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    dbTransactionMock.mockImplementation(async (callback: (tx: typeof import("@/lib/db").db) => Promise<unknown>) =>
      callback({
        group: {
          create: groupCreateMock,
          update: groupUpdateMock,
        },
        user: {
          update: userUpdateMock,
        },
      } as unknown as typeof import("@/lib/db").db),
    );
  });

  test("createGroupAction returns friendly message when leader is already assigned", async () => {
    groupFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({
      id: "leader-2",
      role: "LEADER",
      status: "ACTIVE",
      groupId: "group-2",
      ledGroup: {
        id: "group-2",
      },
    });

    const formData = new FormData();
    formData.set("name", "一组");
    formData.set("slogan", "冲刺");
    formData.set("remark", "重点组");
    formData.set("leaderUserId", "leader-2");

    await expect(createGroupAction(undefined, formData)).resolves.toEqual({
      status: "error",
      message: "该组长已被分配到其他小组，请先解绑后再试",
      values: {
        name: "一组",
        slogan: "冲刺",
        remark: "重点组",
        leaderUserId: "leader-2",
      },
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  test("createGroupAction rejects inactive or admin leader candidates", async () => {
    groupFindUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
      groupId: null,
      ledGroup: null,
    });

    const formData = new FormData();
    formData.set("name", "一组");
    formData.set("leaderUserId", "admin-1");

    await expect(createGroupAction(undefined, formData)).resolves.toEqual({
      status: "error",
      message: "只能从启用中的成员或组长里指定组长",
      values: {
        name: "一组",
        slogan: "",
        remark: "",
        leaderUserId: "admin-1",
      },
    });

    expect(groupCreateMock).not.toHaveBeenCalled();
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  test("createGroupAction syncs assigned leader role and group membership", async () => {
    groupFindUniqueMock.mockResolvedValueOnce(null);
    userFindUniqueMock.mockResolvedValue({
      id: "leader-2",
      role: "MEMBER",
      status: "ACTIVE",
      groupId: "group-old",
      ledGroup: null,
    });
    groupCreateMock.mockResolvedValue({
      id: "group-1",
      name: "一组",
    });
    userUpdateMock.mockResolvedValue({});
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("name", "一组");
    formData.set("leaderUserId", "leader-2");

    await expect(createGroupAction(undefined, formData)).resolves.toEqual({
      status: "success",
      message: "小组创建成功",
      values: {
        name: "",
        slogan: "",
        remark: "",
        leaderUserId: "",
      },
    });

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "leader-2" },
      data: {
        role: "LEADER",
        groupId: "group-1",
      },
    });
    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        leaderUserId: "leader-2",
      },
    });
  });

  test("updateGroupAction redirects with validation notice on oversized input", async () => {
    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("name", "x".repeat(33));

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E5%B0%8F%E7%BB%84%E5%90%8D%E7%A7%B0%E4%B8%8D%E8%83%BD%E8%B6%85%E8%BF%87%2032%20%E4%B8%AA%E5%AD%97%E7%AC%A6",
    );
    expect(groupUpdateMock).not.toHaveBeenCalled();
  });

  test("updateGroupAction applies partial updates without overwriting other fields", async () => {
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("remark", "新备注");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E5%B0%8F%E7%BB%84%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0",
    );

    expect(groupFindUniqueMock).not.toHaveBeenCalled();
    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        remark: "新备注",
      },
    });
  });

  test("updateGroupAction redirects with friendly notice on leader conflict", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderUserId: null,
    });
    userFindUniqueMock.mockResolvedValue({
      id: "leader-2",
      role: "LEADER",
      status: "ACTIVE",
      groupId: "group-2",
      ledGroup: {
        id: "group-2",
      },
    });

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "leader-2");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E8%AF%A5%E7%BB%84%E9%95%BF%E5%B7%B2%E8%A2%AB%E5%88%86%E9%85%8D%E5%88%B0%E5%85%B6%E4%BB%96%E5%B0%8F%E7%BB%84%EF%BC%8C%E8%AF%B7%E5%85%88%E8%A7%A3%E7%BB%91%E5%90%8E%E5%86%8D%E8%AF%95",
    );

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  test("updateGroupAction rejects inactive or admin leader candidates", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderUserId: null,
    });
    userFindUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
      groupId: null,
      ledGroup: null,
    });

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "admin-1");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E5%8F%AA%E8%83%BD%E4%BB%8E%E5%90%AF%E7%94%A8%E4%B8%AD%E7%9A%84%E6%88%90%E5%91%98%E6%88%96%E7%BB%84%E9%95%BF%E9%87%8C%E6%8C%87%E5%AE%9A%E7%BB%84%E9%95%BF",
    );

    expect(userUpdateMock).not.toHaveBeenCalled();
    expect(groupUpdateMock).not.toHaveBeenCalled();
  });

  test("updateGroupAction clears the previous leader role when a group leader is removed", async () => {
    groupFindUniqueMock.mockResolvedValue({
      id: "group-1",
      leaderUserId: "leader-1",
    });
    groupUpdateMock.mockResolvedValue({});
    userUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E5%B0%8F%E7%BB%84%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0",
    );

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "leader-1" },
      data: {
        role: "MEMBER",
      },
    });
    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        leaderUserId: null,
      },
    });
  });

  test("updateGroupAction reassigns a leader and syncs their group membership", async () => {
    groupFindUniqueMock.mockResolvedValueOnce({
      id: "group-1",
      leaderUserId: "leader-1",
    });
    userFindUniqueMock.mockResolvedValue({
      id: "leader-2",
      role: "MEMBER",
      status: "ACTIVE",
      groupId: "group-other",
      ledGroup: null,
    });
    userUpdateMock.mockResolvedValue({});
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "leader-2");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=%E5%B0%8F%E7%BB%84%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0",
    );

    expect(userUpdateMock).toHaveBeenNthCalledWith(1, {
      where: { id: "leader-1" },
      data: {
        role: "MEMBER",
      },
    });
    expect(userUpdateMock).toHaveBeenNthCalledWith(2, {
      where: { id: "leader-2" },
      data: {
        role: "LEADER",
        groupId: "group-1",
      },
    });
    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        leaderUserId: "leader-2",
      },
    });
  });
});
