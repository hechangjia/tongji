import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import HomePage from "@/app/page";

describe("home page redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("redirects guests to login", async () => {
    authMock.mockResolvedValue(null);

    await HomePage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
