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

  test("listLeaderCandidates returns active leader options", async () => {
    userFindManyMock.mockResolvedValue([
      {
        id: "leader-1",
        name: "组长A",
        username: "leader_a",
      },
    ]);

    const result = await listLeaderCandidates();

    expect(userFindManyMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: "leader-1",
        name: "组长A",
        username: "leader_a",
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

  test("createGroupAction syncs assigned leader role and group membership", async () => {
    groupFindUniqueMock.mockResolvedValueOnce(null);
    userFindUniqueMock.mockResolvedValue({
      id: "leader-2",
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
      "redirect:/admin/groups?notice=小组名称不能超过 32 个字符",
    );
    expect(groupUpdateMock).not.toHaveBeenCalled();
  });

  test("updateGroupAction applies partial updates without overwriting other fields", async () => {
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("remark", "新备注");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=小组信息已更新",
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
      groupId: "group-2",
      ledGroup: {
        id: "group-2",
      },
    });

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "leader-2");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=该组长已被分配到其他小组，请先解绑后再试",
    );

    expect(revalidatePathMock).not.toHaveBeenCalled();
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
      "redirect:/admin/groups?notice=小组信息已更新",
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
      groupId: "group-other",
      ledGroup: null,
    });
    userUpdateMock.mockResolvedValue({});
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "group-1");
    formData.set("leaderUserId", "leader-2");

    await expect(updateGroupAction(formData)).rejects.toThrow(
      "redirect:/admin/groups?notice=小组信息已更新",
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
