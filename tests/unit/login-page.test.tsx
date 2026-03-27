import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const loginFormMock = vi.hoisted(() => vi.fn());
const registerFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/login-form", () => ({
  LoginForm: ({ callbackUrl }: { callbackUrl: string }) => {
    loginFormMock({ callbackUrl });
    return <div>login-form</div>;
  },
}));

vi.mock("@/components/register-form", () => ({
  RegisterForm: ({ callbackUrl }: { callbackUrl?: string }) => {
    registerFormMock({ callbackUrl });
    return <div>register-form</div>;
  },
}));

import LoginPage from "@/app/(auth)/login/page";

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null);
  });

  test("renders both login and register sections", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("账号登录")).toBeInTheDocument();
    expect(screen.getByText("成员注册")).toBeInTheDocument();
  });

  test("passes sanitized callbackUrl to both login and register forms", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({
          callbackUrl: "/records",
        }),
      }),
    );

    expect(loginFormMock).toHaveBeenCalledWith({ callbackUrl: "/records" });
    expect(registerFormMock).toHaveBeenCalledWith({ callbackUrl: "/records" });
  });

  test("does not force callbackUrl into register form when search param is absent", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(registerFormMock).toHaveBeenCalledWith({ callbackUrl: undefined });
  });
});
