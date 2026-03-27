import { beforeEach, describe, expect, test, vi } from "vitest";
import { Role, UserStatus } from "@prisma/client";

const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userCreateMock = vi.hoisted(() => vi.fn());
const hashPasswordMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
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

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next-auth", () => ({
  AuthError: authErrorClassMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
      create: userCreateMock,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: hashPasswordMock,
}));

vi.mock("@/lib/auth", () => ({
  signIn: signInMock,
}));

import { registerMemberAction } from "@/app/(auth)/login/actions";
import type { RegisterFormState } from "@/app/(auth)/login/form-state";

describe("login register actions", () => {
  const initialState: RegisterFormState = {
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("registerMemberAction signs in and redirects to callback target after creating active member", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({});
    hashPasswordMock.mockResolvedValue("hashed-password");
    signInMock.mockImplementation(() => {
      throw new Error("redirect:/records");
    });

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");
    formData.set("callbackUrl", "/records");

    await expect(registerMemberAction(initialState, formData)).rejects.toThrow(
      "redirect:/records",
    );
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { username: "member09" },
      select: { id: true },
    });
    expect(hashPasswordMock).toHaveBeenCalledWith("member123456");
    expect(userCreateMock).toHaveBeenCalledWith({
      data: {
        username: "member09",
        name: "member09",
        passwordHash: "hashed-password",
        role: Role.MEMBER,
        status: UserStatus.ACTIVE,
      },
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      username: "member09",
      password: "member123456",
      redirectTo: "/records",
    });
  });

  test("registerMemberAction returns friendly error when create hits unique conflict", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    userCreateMock.mockRejectedValue({ code: "P2002" });
    hashPasswordMock.mockResolvedValue("hashed-password");

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");

    await expect(registerMemberAction(initialState, formData)).resolves.toEqual({
      error: "该账号已存在，请更换后重试",
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  test("registerMemberAction returns recoverable error when auto-login fails", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({});
    hashPasswordMock.mockResolvedValue("hashed-password");
    signInMock.mockRejectedValue(new authErrorClassMock("CallbackRouteError"));

    const formData = new FormData();
    formData.set("username", "member09");
    formData.set("password", "member123456");

    await expect(registerMemberAction(initialState, formData)).resolves.toEqual({
      error: "注册成功，请使用新账号登录",
    });
  });
});
