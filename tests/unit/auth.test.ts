import { describe, expect, test } from "vitest";
import { canAccessAdmin } from "@/lib/permissions";

describe("permissions", () => {
  test("member cannot access admin routes", () => {
    expect(canAccessAdmin({ role: "MEMBER" })).toBe(false);
  });

  test("admin can access admin routes", () => {
    expect(canAccessAdmin({ role: "ADMIN" })).toBe(true);
  });
});
