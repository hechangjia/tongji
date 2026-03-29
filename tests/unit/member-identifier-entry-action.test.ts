import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const saveIdentifierSaleForUserMock = vi.hoisted(() => vi.fn());
const getMemberIdentifierWorkspaceMock = vi.hoisted(() => vi.fn());
const refreshLeaderboardCachesMock = vi.hoisted(() => vi.fn());
const refreshLeaderWorkbenchCachesMock = vi.hoisted(() => vi.fn());
const refreshEntryInsightsCacheMock = vi.hoisted(() => vi.fn());
const refreshMemberRecordsCacheMock = vi.hoisted(() => vi.fn());
const getTodaySaleDateValueMock = vi.hoisted(() => vi.fn(() => "2026-03-28"));
const saveSalesRecordForUserMock = vi.hoisted(() => vi.fn());
const saleDateToValueMock = vi.hoisted(() => vi.fn((value: string | Date) => String(value)));
const getMemberDailyTargetFeedbackMock = vi.hoisted(() => vi.fn());
const getMemberSelfTrendSummaryMock = vi.hoisted(() => vi.fn());
const getMemberDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const getMemberRecentRemindersMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/member-identifier-sale-service", () => ({
  saveIdentifierSaleForUser: saveIdentifierSaleForUserMock,
  getMemberIdentifierWorkspace: getMemberIdentifierWorkspaceMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  refreshLeaderboardCaches: refreshLeaderboardCachesMock,
  refreshLeaderWorkbenchCaches: refreshLeaderWorkbenchCachesMock,
}));

vi.mock("@/server/services/entry-insights-cache", () => ({
  refreshEntryInsightsCache: refreshEntryInsightsCacheMock,
}));

vi.mock("@/server/services/member-records-cache", () => ({
  refreshMemberRecordsCache: refreshMemberRecordsCacheMock,
}));

vi.mock("@/server/services/sales-service", () => ({
  getTodaySaleDateValue: getTodaySaleDateValueMock,
  saveSalesRecordForUser: saveSalesRecordForUserMock,
  saleDateToValue: saleDateToValueMock,
}));

vi.mock("@/server/services/daily-target-service", () => ({
  getMemberDailyTargetFeedback: getMemberDailyTargetFeedbackMock,
  getMemberSelfTrendSummary: getMemberSelfTrendSummaryMock,
}));

vi.mock("@/server/services/daily-rhythm-service", () => ({
  getMemberDailyRhythmSummary: getMemberDailyRhythmSummaryMock,
}));

vi.mock("@/server/services/member-reminder-service", () => ({
  getMemberRecentReminders: getMemberRecentRemindersMock,
}));

import { saveIdentifierSaleAction } from "@/app/(member)/entry/actions";

describe("member identifier entry action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
      },
    });
    getMemberIdentifierWorkspaceMock.mockResolvedValue({
      overview: {
        availableCodeCount: 1,
        assignedLeadCount: 0,
        todaySaleCount: 1,
        todayCount40: 1,
        todayCount60: 0,
      },
      codeOptions: [{ id: "code-2", code: "A002" }],
      leadOptions: [],
      recentSales: [],
    });
  });

  test("returns refreshed workspace data after saving an assigned-lead sale", async () => {
    saveIdentifierSaleForUserMock.mockResolvedValue({
      sale: {
        id: "sale-1",
        createdAt: new Date("2026-03-28T10:30:00.000Z"),
      },
      legacyRecord: {
        count40: 1,
        count60: 0,
      },
      prospectLead: {
        id: "lead-1",
      },
      sourceLabel: "管理员分配线索",
    });

    const formData = new FormData();
    formData.set("codeId", "code-1");
    formData.set("planType", "PLAN_40");
    formData.set("saleDate", "2026-03-28");
    formData.set("sourceMode", "ASSIGNED_LEAD");
    formData.set("prospectLeadId", "lead-1");
    formData.set("followUpItemId", "follow-1");
    formData.set("remark", "现场转化");

    await expect(saveIdentifierSaleAction(undefined, formData)).resolves.toMatchObject({
      status: "success",
      message: "识别码成交已保存",
      summary: {
        saleId: "sale-1",
        planType: "PLAN_40",
        sourceLabel: "管理员分配线索",
      },
      workspace: {
        overview: {
          todaySaleCount: 1,
        },
      },
    });

    expect(saveIdentifierSaleForUserMock).toHaveBeenCalledWith(
      "member-1",
      expect.objectContaining({
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "ASSIGNED_LEAD",
        prospectLeadId: "lead-1",
        followUpItemId: "follow-1",
        remark: "现场转化",
      }),
    );
    expect(refreshLeaderboardCachesMock).toHaveBeenCalledTimes(1);
    expect(refreshLeaderWorkbenchCachesMock).toHaveBeenCalledTimes(1);
    expect(refreshEntryInsightsCacheMock).toHaveBeenCalledTimes(1);
    expect(refreshMemberRecordsCacheMock).toHaveBeenCalledTimes(1);
  });

  test("returns a friendly error and preserves form values on failure", async () => {
    saveIdentifierSaleForUserMock.mockRejectedValue(
      new Error("该 QQ 线索已分配给其他成员，不能直接复用"),
    );

    const formData = new FormData();
    formData.set("codeId", "code-1");
    formData.set("planType", "PLAN_40");
    formData.set("saleDate", "2026-03-28");
    formData.set("sourceMode", "MANUAL_INPUT");
    formData.set("qqNumber", "123456");
    formData.set("major", "计算机");
    formData.set("followUpItemId", "follow-manual-1");
    formData.set("remark", "现场转化");

    await expect(saveIdentifierSaleAction(undefined, formData)).resolves.toMatchObject({
      status: "error",
      message: "该 QQ 线索已分配给其他成员，不能直接复用",
      values: {
        qqNumber: "123456",
        major: "计算机",
        sourceMode: "MANUAL_INPUT",
        followUpItemId: "follow-manual-1",
      },
    });

    expect(refreshLeaderboardCachesMock).not.toHaveBeenCalled();
    expect(refreshLeaderWorkbenchCachesMock).not.toHaveBeenCalled();
  });
});
