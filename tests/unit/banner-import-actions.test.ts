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
      "redirect:/admin/banners?notice=%E5%B7%B2%E4%BB%8E%20hitokoto%20%E5%AF%BC%E5%85%A5%E4%B8%80%E6%9D%A1%E6%96%87%E6%A1%88%EF%BC%8C%E9%BB%98%E8%AE%A4%E5%81%9C%E7%94%A8%EF%BC%8C%E8%AF%B7%E7%A1%AE%E8%AE%A4%E5%90%8E%E5%90%AF%E7%94%A8",
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
