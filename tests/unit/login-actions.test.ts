import { beforeEach, describe, expect, test, vi } from "vitest";

const checkUsernameAvailableMock = vi.hoisted(() => vi.fn());
const createMemberMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const checkRateLimitMock = vi.hoisted(() =>
  vi.fn(() => ({ allowed: true, remaining: 9, retryAfterMs: 0 })),
);
const cleanupExpiredEntriesMock = vi.hoisted(() => vi.fn());
const authErrorClassMock = vi.hoisted(
  () =>
    class AuthError extends Error {
      type: string;

      constructor(type = "CredentialsSignin") {
        super(type);
        this.type = type;
      }
    },
);
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@prisma/client", () => ({
  Role: { ADMIN: "ADMIN", LEADER: "LEADER", MEMBER: "MEMBER" },
}));

vi.mock("next-auth", () => ({
  AuthError: authErrorClassMock,
}));

vi.mock("@/server/services/member-service", () => ({
  checkUsernameAvailable: checkUsernameAvailableMock,
  createMember: createMemberMock,
}));

vi.mock("@/lib/auth", () => ({
  signIn: signInMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    INVITE_CODE: "maika2026",
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  cleanupExpiredEntries: cleanupExpiredEntriesMock,
}));

import {
  loginAction,
  registerMemberAction,
} from "@/app/(auth)/login/actions";
import type {
  LoginFormState,
  RegisterFormState,
} from "@/app/(auth)/login/form-state";

describe("login actions", () => {
  const initialLoginState: LoginFormState = {
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({
      allowed: true,
      remaining: 9,
      retryAfterMs: 0,
    });
  });

  test("loginAction calls signIn with credentials", async () => {
    signInMock.mockImplementation(() => {
      throw new Error("redirect:/entry");
    });

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "password123");
    formData.set("callbackUrl", "");

    await expect(loginAction(initialLoginState, formData)).rejects.toThrow(
      "redirect:",
    );
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      username: "testuser",
      password: "password123",
      redirectTo: expect.any(String),
    });
  });

  test("loginAction returns error on CredentialsSignin", async () => {
    signInMock.mockRejectedValue(new authErrorClassMock("CredentialsSignin"));

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "wrongpassword");
    formData.set("callbackUrl", "");

    const result = await loginAction(initialLoginState, formData);
    expect(result).toEqual({ error: "账号或密码错误" });
  });

  test("loginAction returns rate limit error when blocked", async () => {
    checkRateLimitMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfterMs: 5 * 60 * 1000,
    });

    const formData = new FormData();
    formData.set("username", "testuser");
    formData.set("password", "password123");
    formData.set("callbackUrl", "");

    const result = await loginAction(initialLoginState, formData);
    expect(result.error).toMatch(/登录尝试过于频繁/);
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("loginAction validates input", async () => {
    const formData = new FormData();
    formData.set("username", "");
    formData.set("password", "");

    const result = await loginAction(initialLoginState, formData);
    expect(result.error).toBeTruthy();
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("register actions", () => {
  const initialState: RegisterFormState = {
    status: "idle",
    message: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkUsernameAvailableMock.mockResolvedValue(undefined);
    createMemberMock.mockResolvedValue({});
  });

  test("registerMemberAction signs in and redirects to callback target after creating active member", async () => {
    signInMock.mockImplementation(() => {
      throw new Error("redirect:/records");
    });

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "maika2026");
    formData.set("callbackUrl", "/records");

    await expect(registerMemberAction(initialState, formData)).rejects.toThrow(
      "redirect:/records",
    );
    expect(checkUsernameAvailableMock).toHaveBeenCalledWith("member09");
    expect(createMemberMock).toHaveBeenCalledWith({
      username: "member09",
      name: "member09",
      password: "member123456",
      status: "ACTIVE",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      username: "member09",
      password: "member123456",
      redirectTo: "/records",
    });
  });

  test("registerMemberAction returns error for invalid invite code", async () => {
    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "wrongcode");

    const result = await registerMemberAction(initialState, formData);
    expect(result).toEqual({
      status: "error",
      message: "邀请码无效，请联系管理员获取正确的邀请码",
    });
    expect(checkUsernameAvailableMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("registerMemberAction returns error when invite code is missing", async () => {
    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "");

    const result = await registerMemberAction(initialState, formData);
    expect(result).toEqual({
      status: "error",
      message: "请输入邀请码",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("registerMemberAction returns friendly error when username already exists", async () => {
    checkUsernameAvailableMock.mockRejectedValue(new Error("该账号已存在"));

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "maika2026");

    await expect(registerMemberAction(initialState, formData)).resolves.toEqual({
      status: "error",
      message: "该账号已存在，请更换后重试",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("registerMemberAction returns friendly error when create hits unique conflict", async () => {
    createMemberMock.mockRejectedValue({ code: "P2002" });

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "maika2026");

    await expect(registerMemberAction(initialState, formData)).resolves.toEqual({
      status: "error",
      message: "该账号已存在，请更换后重试",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("registerMemberAction returns recoverable error when auto-login fails", async () => {
    signInMock.mockRejectedValue(new authErrorClassMock("CallbackRouteError"));

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("inviteCode", "maika2026");

    await expect(registerMemberAction(initialState, formData)).resolves.toEqual({
      status: "manual_login",
      message: "注册成功，请使用新账号登录",
    });
  });

  test("registerMemberAction defaults to member entry target when callbackUrl is absent", async () => {
    signInMock.mockImplementation(() => {
      throw new Error("redirect:/entry");
    });

    const formData = new FormData();
    formData.set("username", "member10");
    formData.set("password", "member123456");
    formData.set("inviteCode", "maika2026");

    await expect(registerMemberAction(initialState, formData)).rejects.toThrow(
      "redirect:/entry",
    );
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      username: "member10",
      password: "member123456",
      redirectTo: "/entry",
    });
  });
});
