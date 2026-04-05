import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const getSalesRecordForUserOnDateMock = vi.hoisted(() => vi.fn());
const getCachedMemberDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const getCachedMemberEntryInsightsMock = vi.hoisted(() => vi.fn());
const getCachedMemberIdentifierWorkspaceMock = vi.hoisted(() => vi.fn());
const salesEntryPageClientMock = vi.hoisted(() => vi.fn());
const buildSalesEntryDefaultsMock = vi.hoisted(() => vi.fn());
const getTodaySaleDateValueMock = vi.hoisted(() => vi.fn(() => "2026-03-28"));
const saleDateToValueMock = vi.hoisted(
  () => vi.fn((value: string | Date) => (typeof value === "string" ? value : value.toISOString().slice(0, 10))),
);

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/components/sales-entry-page-client", () => ({
  SalesEntryPageClient: (props: Record<string, unknown>) => {
    salesEntryPageClientMock(props);
    return <div>sales-entry-page-client</div>;
  },
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  getCachedMemberDailyRhythmSummary: getCachedMemberDailyRhythmSummaryMock,
}));

vi.mock("@/server/services/entry-insights-cache", () => ({
  getCachedMemberEntryInsights: getCachedMemberEntryInsightsMock,
}));

vi.mock("@/server/services/member-records-cache", () => ({
  getCachedMemberIdentifierWorkspace: getCachedMemberIdentifierWorkspaceMock,
}));

vi.mock("@/server/services/sales-service", () => ({
  buildSalesEntryDefaults: buildSalesEntryDefaultsMock,
  getSalesRecordForUserOnDate: getSalesRecordForUserOnDateMock,
  getTodaySaleDateValue: getTodaySaleDateValueMock,
  saleDateToValue: saleDateToValueMock,
}));

import EntryPage from "@/app/(member)/entry/page";

describe("entry page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "member-1",
        role: "MEMBER",
        username: "member01",
        name: "成员一号",
        status: "ACTIVE",
      },
    });
    getSalesRecordForUserOnDateMock.mockResolvedValue(null);
    buildSalesEntryDefaultsMock.mockReturnValue({
      saleDate: "2026-03-28",
      count40: "0",
      count60: "0",
      remark: "",
    });
    getCachedMemberDailyRhythmSummaryMock.mockResolvedValue({
      state: "MISSING",
      title: "今天还没有提交记录",
      message: "请尽快提交今日数据。",
      reviewStatus: null,
      reviewStatusLabel: "未提交",
      reviewNote: null,
      isTemporaryTop3: false,
      isFormalTop3: false,
      temporaryRank: null,
      formalRank: null,
      top3Label: null,
      top3Message: null,
      primaryAction: null,
      secondaryActions: [],
    });
    getCachedMemberEntryInsightsMock.mockResolvedValue({
      targetFeedback: {
        targetTotal: 8,
        currentTotal: 0,
        gap: 8,
        completionRate: 0,
        status: "BEHIND",
      },
      selfTrend: {
        direction: "FLAT",
        label: "接近近 7 天常态",
        message: "今天的完成度与最近几天的平均水平接近。",
      },
      recentReminders: [],
    });
    getCachedMemberIdentifierWorkspaceMock.mockResolvedValue({
      overview: {
        availableCodeCount: 2,
        assignedLeadCount: 1,
        todaySaleCount: 1,
        todayCount40: 1,
        todayCount60: 0,
      },
      codeOptions: [{ id: "code-1", code: "A001" }],
      leadOptions: [{ id: "lead-1", qqNumber: "123456", major: "计算机", sourceLabel: "管理员分配线索" }],
      recentSales: [],
    });
  });

  test("uses cached member entry insights and identifier workspace for the initial page payload", async () => {
    const todaySaleDate = getTodaySaleDateValueMock();

    render(await EntryPage());

    expect(getCachedMemberEntryInsightsMock).toHaveBeenCalledWith({
      userId: "member-1",
      todaySaleDate,
    });
    expect(getCachedMemberIdentifierWorkspaceMock).toHaveBeenCalledWith(
      "member-1",
      todaySaleDate,
    );
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("sales-entry-page-client")).toBeInTheDocument();
    expect(salesEntryPageClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialIdentifierWorkspace: expect.objectContaining({
          overview: {
            availableCodeCount: 2,
            assignedLeadCount: 1,
            todaySaleCount: 1,
            todayCount40: 1,
            todayCount60: 0,
          },
          codeOptions: [{ id: "code-1", code: "A001" }],
        }),
        initialIdentifierValues: {
          codeId: "",
          planType: "PLAN_40",
          saleDate: todaySaleDate,
          sourceMode: "ASSIGNED_LEAD",
          prospectLeadId: "",
          qqNumber: "",
          major: "",
          remark: "",
          followUpItemId: "",
        },
        initialTargetFeedback: {
          targetTotal: 8,
          currentTotal: 0,
          gap: 8,
          completionRate: 0,
          status: "BEHIND",
        },
        initialRecentReminders: [],
      }),
    );
  });

  test("seeds an optional followUpItemId from search params without changing other identifier defaults", async () => {
    const todaySaleDate = getTodaySaleDateValueMock();

    render(
      await EntryPage({
        searchParams: Promise.resolve({
          followUpItemId: "follow-1",
        }),
      }),
    );

    expect(salesEntryPageClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialIdentifierValues: {
          codeId: "",
          planType: "PLAN_40",
          saleDate: todaySaleDate,
          sourceMode: "ASSIGNED_LEAD",
          prospectLeadId: "",
          qqNumber: "",
          major: "",
          remark: "",
          followUpItemId: "follow-1",
        },
      }),
    );
  });
});
