import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const createBannerQuoteMock = vi.hoisted(() => vi.fn());
const fetchHitokotoBannerDraftMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/banner-service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/banner-service")>(
    "@/server/services/banner-service",
  );

  return {
    ...actual,
    createBannerQuote: createBannerQuoteMock,
  };
});

vi.mock("@/server/services/hitokoto-service", () => ({
  fetchHitokotoBannerDraft: fetchHitokotoBannerDraftMock,
}));

import { importHitokotoBannerAction } from "@/app/(admin)/admin/banners/actions";

describe("banner import action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("imports one hitokoto quote into the local banner pool", async () => {
    fetchHitokotoBannerDraftMock.mockResolvedValue({
      content: "万事皆允，万物皆虚。",
      author: "刺客信条",
      sourceType: "CUSTOM",
      status: "INACTIVE",
    });

    await expect(importHitokotoBannerAction()).rejects.toThrow(
      "redirect:/admin/banners?notice=",
    );

    expect(createBannerQuoteMock).toHaveBeenCalledWith({
      content: "万事皆允，万物皆虚。",
      author: "刺客信条",
      sourceType: "CUSTOM",
      status: "INACTIVE",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/banners");
  });
});
