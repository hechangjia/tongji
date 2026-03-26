import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userUpdateMock = vi.hoisted(() => vi.fn());
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
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: hashPasswordMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

import { updateMemberAction } from "@/app/(admin)/admin/members/actions";

describe("member update action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("updates username when it is unique", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    userUpdateMock.mockResolvedValue({});
    hashPasswordMock.mockResolvedValue("hashed-password");

    const formData = new FormData();
    formData.set("id", "admin-1");
    formData.set("username", "new_admin");
    formData.set("name", "系统管理员");
    formData.set("status", "ACTIVE");
    formData.set("password", "changed-pass");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=成员信息已更新",
    );

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { username: "new_admin" },
      select: { id: true },
    });
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: {
        username: "new_admin",
        name: "系统管理员",
        status: "ACTIVE",
        passwordHash: "hashed-password",
      },
    });
    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("rejects duplicate usernames owned by another user", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "member-2" });

    const formData = new FormData();
    formData.set("id", "admin-1");
    formData.set("username", "taken_name");
    formData.set("name", "系统管理员");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=该账号已存在，请更换后重试",
    );

    expect(userUpdateMock).not.toHaveBeenCalled();
    expect(refreshLeaderboardCachesMock).not.toHaveBeenCalled();
  });
});
