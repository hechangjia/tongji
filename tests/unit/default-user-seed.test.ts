import { describe, expect, test, vi } from "vitest";
import { ensureDefaultUsers } from "@/server/services/default-user-seed";

describe("ensureDefaultUsers", () => {
  test("creates default accounts only when they do not exist", async () => {
    const findFirst = vi.fn().mockResolvedValueOnce(null);
    const findUnique = vi.fn().mockResolvedValueOnce(null);
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: "admin-id" })
      .mockResolvedValueOnce({ id: "member-id" });

    const users = await ensureDefaultUsers(
      {
        user: {
          findFirst,
          findUnique,
          create,
        },
      },
      {
        adminPasswordHash: "admin-hash",
        memberPasswordHash: "member-hash",
      },
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: { role: "ADMIN" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, {
      data: {
        username: "admin",
        passwordHash: "admin-hash",
        name: "系统管理员",
        role: "ADMIN",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: {
        username: "member01",
        passwordHash: "member-hash",
        name: "示例成员",
        role: "MEMBER",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    expect(users).toEqual({
      admin: { id: "admin-id" },
      member: { id: "member-id" },
    });
  });

  test("keeps existing accounts unchanged when seed runs again", async () => {
    const findFirst = vi.fn().mockResolvedValueOnce({ id: "existing-admin-id" });
    const findUnique = vi.fn().mockResolvedValueOnce({ id: "existing-member-id" });
    const create = vi.fn();

    const users = await ensureDefaultUsers(
      {
        user: {
          findFirst,
          findUnique,
          create,
        },
      },
      {
        adminPasswordHash: "admin-hash",
        memberPasswordHash: "member-hash",
      },
    );

    expect(create).not.toHaveBeenCalled();
    expect(users).toEqual({
      admin: { id: "existing-admin-id" },
      member: { id: "existing-member-id" },
    });
  });

  test("does not recreate default admin after the admin username was customized", async () => {
    const findFirst = vi.fn().mockResolvedValueOnce({ id: "custom-admin-id" });
    const findUnique = vi.fn().mockResolvedValueOnce(null);
    const create = vi.fn().mockResolvedValueOnce({ id: "member-id" });

    const users = await ensureDefaultUsers(
      {
        user: {
          findFirst,
          findUnique,
          create,
        },
      },
      {
        adminPasswordHash: "admin-hash",
        memberPasswordHash: "member-hash",
      },
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        username: "member01",
        passwordHash: "member-hash",
        name: "示例成员",
        role: "MEMBER",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    expect(users).toEqual({
      admin: { id: "custom-admin-id" },
      member: { id: "member-id" },
    });
  });
});
