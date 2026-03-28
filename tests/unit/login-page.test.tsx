import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const loginFormMock = vi.hoisted(() => vi.fn());
const registerFormMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
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
    cookiesMock.mockResolvedValue({
      has: vi.fn().mockReturnValue(false),
    });
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

  test("skips auth lookup for anonymous visitors without session cookies", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(authMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("checks auth and redirects when a session cookie candidate is present", async () => {
    cookiesMock.mockResolvedValue({
      has: vi
        .fn()
        .mockImplementation((name: string) => name === "authjs.session-token"),
    });
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
      },
    });

    await LoginPage({
      searchParams: Promise.resolve({}),
    });

    expect(authMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/entry");
  });
});
