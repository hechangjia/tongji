import { describe, expect, test } from "vitest";
import { memberSchema } from "@/lib/validators/member";

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
      status: "ACTIVE",
    });

    expect(parsed.username).toBe("member02");
    expect(parsed.status).toBe("ACTIVE");
  });
});
