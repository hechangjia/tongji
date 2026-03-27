import { describe, expect, test } from "vitest";
import {
  canAccessAdmin,
  canAccessMemberArea,
  getDefaultRedirectPath,
} from "@/lib/permissions";

describe("permissions", () => {
  test("member cannot access admin routes", () => {
    expect(canAccessAdmin({ role: "MEMBER" })).toBe(false);
  });

  test("admin can access admin routes", () => {
    expect(canAccessAdmin({ role: "ADMIN" })).toBe(true);
  });

  test("leader cannot access admin routes", () => {
    expect(canAccessAdmin({ role: "LEADER" })).toBe(false);
  });

  test("default redirect sends leaders to the leader group page", () => {
    expect(getDefaultRedirectPath("LEADER")).toBe("/leader/group");
  });

  test("leader cannot access member routes", () => {
    expect(canAccessMemberArea({ role: "LEADER" })).toBe(false);
  });

  test("member and admin can access member routes", () => {
    expect(canAccessMemberArea({ role: "MEMBER" })).toBe(true);
    expect(canAccessMemberArea({ role: "ADMIN" })).toBe(true);
  });
});
