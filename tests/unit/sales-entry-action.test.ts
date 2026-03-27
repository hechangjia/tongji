import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const saveSalesRecordForUserMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/server/services/sales-service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/sales-service")>(
    "@/server/services/sales-service",
  );

  return {
    ...actual,
    saveSalesRecordForUser: saveSalesRecordForUserMock,
  };
});

import { saveSalesEntryAction } from "@/app/(member)/entry/actions";

describe("sales entry action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
      },
    });
  });

  test("returns structured summary on first successful save", async () => {
    saveSalesRecordForUserMock.mockResolvedValue({
      isUpdate: false,
      record: {
        saleDate: new Date("2026-03-26T00:00:00.000Z"),
        count40: 5,
        count60: 2,
        remark: "地推",
        updatedAt: new Date("2026-03-26T08:15:00.000Z"),
      },
    });

    const formData = new FormData();
    formData.set("saleDate", "2026-03-26");
    formData.set("count40", "5");
    formData.set("count60", "2");
    formData.set("remark", "地推");

    await expect(saveSalesEntryAction(undefined, formData)).resolves.toMatchObject({
      status: "success",
      summary: {
        saleDate: "2026-03-26",
        count40: 5,
        count60: 2,
        total: 7,
        remark: "地推",
        isUpdate: false,
        recoveredFromError: false,
      },
    });
  });

  test("marks a retry success as recovered from error", async () => {
    saveSalesRecordForUserMock.mockResolvedValue({
      isUpdate: true,
      record: {
        saleDate: new Date("2026-03-26T00:00:00.000Z"),
        count40: 5,
        count60: 2,
        remark: "",
        updatedAt: new Date("2026-03-26T08:15:00.000Z"),
      },
    });

    const formData = new FormData();
    formData.set("saleDate", "2026-03-26");
    formData.set("count40", "5");
    formData.set("count60", "2");
    formData.set("remark", "");

    await expect(
      saveSalesEntryAction(
        {
          status: "error",
          message: "保存失败",
          values: {
            saleDate: "2026-03-26",
            count40: "5",
            count60: "2",
            remark: "",
          },
        },
        formData,
      ),
    ).resolves.toMatchObject({
      status: "success",
      summary: {
        isUpdate: true,
        recoveredFromError: true,
      },
    });
  });
});
