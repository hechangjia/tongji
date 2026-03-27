import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const salesRecordUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    salesRecord: {
      update: salesRecordUpdateMock,
    },
  },
}));

import { reviewSalesRecordAction } from "@/app/(admin)/admin/sales/actions";

describe("admin sales review action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
  });

  test("approves a sales record and refreshes leaderboard caches", async () => {
    salesRecordUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "record-1");
    formData.set("decision", "APPROVED");
    formData.set("reviewNote", "");
    formData.set("returnTo", "/admin/sales");

    await expect(reviewSalesRecordAction("APPROVED", formData)).rejects.toThrow(
      "redirect:/admin/sales?notice=",
    );

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-1" },
      data: {
        reviewStatus: "APPROVED",
        reviewedAt: expect.any(Date),
        reviewNote: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/sales");
    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("keeps reviewNote only when rejecting a sales record", async () => {
    salesRecordUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "record-2");
    formData.set("decision", "REJECTED");
    formData.set("reviewNote", "数量异常，请核对");
    formData.set("returnTo", "/admin/sales");

    await expect(reviewSalesRecordAction("REJECTED", formData)).rejects.toThrow(
      "redirect:/admin/sales?notice=",
    );

    expect(salesRecordUpdateMock).toHaveBeenCalledWith({
      where: { id: "record-2" },
      data: {
        reviewStatus: "REJECTED",
        reviewedAt: expect.any(Date),
        reviewNote: "数量异常，请核对",
      },
    });
  });
});
