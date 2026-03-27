import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const saveSalesRecordForUserMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const getMemberDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const salesRecordUpdateMock = vi.hoisted(() => vi.fn());
const dailyTargetUpdateMock = vi.hoisted(() => vi.fn());
const memberReminderCreateMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const userUpdateMock = vi.hoisted(() => vi.fn());
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

vi.mock("@/server/services/sales-service", async () => {
  const actual = await vi.importActual<typeof import("@/server/services/sales-service")>(
    "@/server/services/sales-service",
  );

  return {
    ...actual,
    saveSalesRecordForUser: saveSalesRecordForUserMock,
  };
});

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
}));

vi.mock("@/server/services/daily-target-service", () => ({
  updateFinalDailyTarget: dailyTargetUpdateMock,
}));

vi.mock("@/server/services/member-reminder-service", () => ({
  createMemberReminder: memberReminderCreateMock,
}));

vi.mock("@/server/services/daily-rhythm-service", () => ({
  getMemberDailyRhythmSummary: getMemberDailyRhythmSummaryMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    salesRecord: {
      update: salesRecordUpdateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
}));

import { saveSalesEntryAction } from "@/app/(member)/entry/actions";
import {
  reviewSalesRecordAction,
  updateSalesRecordAction,
} from "@/app/(admin)/admin/sales/actions";
import {
  adjustDailyTargetAction,
  sendMemberReminderAction,
} from "@/app/(admin)/admin/insights/actions";
import { updateMemberAction } from "@/app/(admin)/admin/members/actions";

describe("leaderboard cache revalidation on writes", () => {
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
  });

  test("refreshes leaderboard caches after a member saves sales", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
      },
    });
    saveSalesRecordForUserMock.mockResolvedValue({
      isUpdate: true,
      record: {
        saleDate: new Date("2026-03-26T00:00:00.000Z"),
        count40: 1,
        count60: 2,
        remark: "",
        reviewStatus: "PENDING",
        lastSubmittedAt: new Date("2026-03-26T08:00:00.000Z"),
        updatedAt: new Date("2026-03-26T08:00:00.000Z"),
      },
    });

    const formData = new FormData();
    formData.set("saleDate", "2026-03-26");
    formData.set("count40", "1");
    formData.set("count60", "2");
    formData.set("remark", "");

    await saveSalesEntryAction(undefined, formData);

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("refreshes leaderboard caches after admin edits a sales record", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    salesRecordUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "record-1");
    formData.set("count40", "3");
    formData.set("count60", "4");
    formData.set("remark", "ok");
    formData.set("returnTo", "/admin/sales");

    await expect(updateSalesRecordAction(formData)).rejects.toThrow(
      "redirect:/admin/sales?notice=",
    );

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("refreshes leaderboard caches after admin reviews a sales record", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    salesRecordUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("id", "record-1");
    formData.set("decision", "APPROVED");
    formData.set("reviewNote", "");
    formData.set("returnTo", "/admin/sales");

    await expect(reviewSalesRecordAction("APPROVED", formData)).rejects.toThrow(
      "redirect:/admin/sales?notice=",
    );

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("refreshes leaderboard caches after admin updates member profile data", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    userUpdateMock.mockResolvedValue({});
    userFindUniqueMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "member-1");
    formData.set("username", "member_renamed");
    formData.set("name", "新的名字");
    formData.set("status", "ACTIVE");
    formData.set("password", "");

    await expect(updateMemberAction(formData)).rejects.toThrow(
      "redirect:/admin/members?notice=",
    );

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("refreshes leaderboard caches after admin adjusts a daily target", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    dailyTargetUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("targetId", "target-1");
    formData.set("finalTotal", "8");
    formData.set("returnTo", "/admin/insights");

    await expect(adjustDailyTargetAction(formData)).rejects.toThrow(
      "redirect:/admin/insights?notice=",
    );

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });

  test("refreshes leaderboard caches after admin sends a member reminder", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    memberReminderCreateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("userId", "member-1");
    formData.set("template", "TARGET_GAP");
    formData.set("title", "今日目标仍有差距");
    formData.set("content", "你今天距离目标还差 3 单，请尽快跟进。");
    formData.set("returnTo", "/admin/insights");

    await expect(sendMemberReminderAction(formData)).rejects.toThrow(
      "redirect:/admin/insights?notice=",
    );

    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
  });
});
