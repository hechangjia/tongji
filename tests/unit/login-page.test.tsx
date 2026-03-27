import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/login-form", () => ({
  LoginForm: () => <div>login-form</div>,
}));

vi.mock("@/components/register-form", () => ({
  RegisterForm: () => <div>register-form</div>,
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
});
