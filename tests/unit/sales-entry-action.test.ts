import { beforeEach, describe, expect, test, vi } from "vitest";
import { getTodaySaleDateValue } from "@/server/services/sales-service";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const saveSalesRecordForUserMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const getMemberDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

vi.mock("@/server/services/daily-rhythm-service", () => ({
  getMemberDailyRhythmSummary: getMemberDailyRhythmSummaryMock,
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
    getMemberDailyRhythmSummaryMock.mockResolvedValue({
      state: "PENDING_REVIEW",
      title: "当日节奏摘要",
      message: "今天的提交已收到，等待管理员审核",
      reviewStatus: "PENDING",
      reviewStatusLabel: "待审核",
      reviewNote: null,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      top3Label: null,
      top3Message: null,
      primaryAction: {
        href: "/leaderboard/daily",
        label: "查看今日榜单",
      },
      secondaryActions: [
        {
          href: "/entry",
          label: "继续填写今日记录",
        },
        {
          href: "/leaderboard/range",
          label: "查看总榜",
        },
      ],
    });
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
      },
    });
  });

  test("preserves the existing today summary timestamp when saving a non-today record", async () => {
    saveSalesRecordForUserMock.mockResolvedValue({
      isUpdate: false,
      record: {
        saleDate: new Date("2026-03-26T00:00:00.000Z"),
        count40: 5,
        count60: 2,
        remark: "地推",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T08:15:00.000Z"),
        updatedAt: new Date("2026-03-26T08:15:00.000Z"),
      },
    });

    const formData = new FormData();
    formData.set("saleDate", "2026-03-26");
    formData.set("count40", "5");
    formData.set("count60", "2");
    formData.set("remark", "地推");

    await expect(
      saveSalesEntryAction(
        {
          status: "success",
          message: "保存成功",
          values: {
            saleDate: getTodaySaleDateValue(),
            count40: "4",
            count60: "1",
            remark: "",
          },
          summary: {
            saleDate: getTodaySaleDateValue(),
            count40: 4,
            count60: 1,
            total: 5,
            remark: "",
            reviewStatus: "PENDING",
            lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
            savedAtIso: "2026-03-27T07:30:45.000Z",
            isUpdate: true,
            recoveredFromError: false,
            dailyRhythm: {
              state: "PENDING_REVIEW",
              title: "当日节奏摘要",
              message: "今天的提交已收到，等待管理员审核",
              reviewStatus: "PENDING",
              reviewStatusLabel: "待审核",
              reviewNote: null,
              isTemporaryTop3: false,
              isFormalTop3: false,
              temporaryRank: null,
              formalRank: null,
              top3Label: null,
              top3Message: null,
              lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
              primaryAction: {
                href: "/leaderboard/daily",
                label: "查看今日榜单",
              },
              secondaryActions: [
                {
                  href: "/entry",
                  label: "继续填写今日记录",
                },
                {
                  href: "/leaderboard/range",
                  label: "查看总榜",
                },
              ],
            },
          },
        },
        formData,
      ),
    ).resolves.toMatchObject({
      status: "success",
      summary: {
        saleDate: "2026-03-26",
        count40: 5,
        count60: 2,
        total: 7,
        remark: "地推",
        reviewStatus: "PENDING",
        lastSubmittedAtIso: expect.any(String),
        isUpdate: false,
        recoveredFromError: false,
        dailyRhythm: {
          lastSubmittedAtIso: "2026-03-27T07:30:45.000Z",
        },
      },
    });
    expect(getMemberDailyRhythmSummaryMock).toHaveBeenCalledWith({
      currentUserId: "member-1",
      todaySaleDate: getTodaySaleDateValue(),
    });
  });

  test("overrides today summary timestamp when saving today's record", async () => {
    const todaySaleDate = getTodaySaleDateValue();
    saveSalesRecordForUserMock.mockResolvedValue({
      isUpdate: false,
      record: {
        saleDate: new Date(`${todaySaleDate}T00:00:00.000Z`),
        count40: 3,
        count60: 1,
        remark: "今日跟进",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-27T09:45:12.000Z"),
        updatedAt: new Date("2026-03-27T09:45:12.000Z"),
      },
    });

    const formData = new FormData();
    formData.set("saleDate", todaySaleDate);
    formData.set("count40", "3");
    formData.set("count60", "1");
    formData.set("remark", "今日跟进");

    await expect(saveSalesEntryAction(undefined, formData)).resolves.toMatchObject({
      status: "success",
      summary: {
        saleDate: todaySaleDate,
        dailyRhythm: {
          lastSubmittedAtIso: "2026-03-27T09:45:12.000Z",
        },
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
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T08:15:00.000Z"),
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
        reviewStatus: "PENDING",
        lastSubmittedAtIso: expect.any(String),
        isUpdate: true,
        recoveredFromError: true,
      },
    });
  });
});
