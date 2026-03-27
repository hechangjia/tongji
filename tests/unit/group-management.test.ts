import { beforeEach, describe, expect, test, vi } from "vitest";

const groupFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    group: {
      findMany: groupFindManyMock,
    },
  },
}));

import { groupSchema, groupUpdateSchema } from "@/lib/validators/group";
import { listGroupsForAdmin } from "@/server/services/group-service";

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
});
