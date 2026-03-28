import { describe, expect, test } from "vitest";
import { memberSchema, memberUpdateSchema } from "@/lib/validators/member";

describe("member schema", () => {
  test("requires username and display name", () => {
    expect(() =>
      memberSchema.parse({
        username: "",
        name: "",
        password: "12345678",
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  test("accepts a valid active member payload", () => {
    const parsed = memberSchema.parse({
      username: "member02",
      name: "测试成员",
      password: "member123456",
      groupId: "group-2",
      remark: "负责晚场跟进",
      status: "ACTIVE",
    });

    expect(parsed.username).toBe("member02");
    expect(parsed.groupId).toBe("group-2");
    expect(parsed.remark).toBe("负责晚场跟进");
    expect(parsed.status).toBe("ACTIVE");
  });

  test("requires a valid username when updating a member", () => {
    expect(() =>
      memberUpdateSchema.parse({
        id: "member-1",
        username: "a",
        name: "测试成员",
        role: "MEMBER",
        groupId: "",
        remark: "",
        status: "ACTIVE",
        password: "",
      }),
    ).toThrow();
  });

  test("accepts a valid username when updating a member", () => {
    const parsed = memberUpdateSchema.parse({
      id: "member-1",
      username: "member01",
      name: "成员1",
      role: "LEADER",
      groupId: "group-1",
      remark: "负责新生点位",
      status: "ACTIVE",
      password: "",
    });

    expect(parsed.username).toBe("member01");
    expect(parsed.role).toBe("LEADER");
    expect(parsed.groupId).toBe("group-1");
    expect(parsed.remark).toBe("负责新生点位");
  });

  test("requires a group when promoting a member to leader", () => {
    expect(() =>
      memberUpdateSchema.parse({
        id: "member-1",
        username: "member01",
        name: "成员1",
        role: "LEADER",
        groupId: "",
        remark: "负责新生点位",
        status: "ACTIVE",
        password: "",
      }),
    ).toThrow("组长必须绑定所属小组");
  });
});
