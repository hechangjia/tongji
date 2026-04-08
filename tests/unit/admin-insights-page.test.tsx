import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const getAdminInsightsDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/admin-insights-cache", () => ({
  getCachedAdminInsightsData: getAdminInsightsDataMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import AdminInsightsPage, {
  AdminInsightsContent,
  AdminInsightsNotice,
} from "@/app/(admin)/admin/insights/page";

const baseInsightsData = {
  overview: {
    highRiskCount: 2,
    mediumRiskCount: 3,
    targetCompletionRate: 67,
    remindersSentCount: 4,
  },
  anomalyDistribution: [
    { label: "结果下滑", count: 2 },
    { label: "目标偏差过大", count: 3 },
  ],
  memberCards: [
    {
      userId: "member-1",
      userName: "成员1",
      targetId: "target-1",
      targetDate: "2026-03-27",
      targetTotal: 8,
      currentTotal: 3,
      riskLevel: "HIGH",
      reasonTags: ["结果下滑", "目标偏差过大"],
      recommendedActions: ["ADJUST_TARGET", "SEND_REMINDER"],
      targetGap: 5,
    },
  ],
  processedCards: [],
} satisfies Awaited<ReturnType<typeof getAdminInsightsDataMock>>;

describe("admin insights page", () => {
  test("exports a deferred content section so the page shell can stream first", async () => {
    const module = await import("@/app/(admin)/admin/insights/page");

    expect(module).toHaveProperty("AdminInsightsContent");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });
    getAdminInsightsDataMock.mockResolvedValue(baseInsightsData);
  });

  test("renders the admin insights shell immediately", async () => {
    render(await AdminInsightsPage());

    expect(screen.getByText("经营诊断中心")).toBeInTheDocument();
  });

  test("does not block the page shell on unresolved search params", () => {
    render(
      AdminInsightsPage({
        searchParams: new Promise(() => {}),
      }),
    );

    expect(screen.getByText("经营诊断中心")).toBeInTheDocument();
  });

  test("renders admin insights overview metrics and risk-ranked member cards in the deferred content section", async () => {
    render(
      await AdminInsightsContent({
        insightsPromise: Promise.resolve(baseInsightsData),
      }),
    );

    expect(screen.getByText("今日高风险成员")).toBeInTheDocument();
    expect(screen.getByText("成员1")).toBeInTheDocument();
    expect(screen.getByText("调整今日目标")).toBeInTheDocument();
    expect(screen.getByText("发送提醒")).toBeInTheDocument();
  });

  test("renders action notice from search params", async () => {
    render(
      await AdminInsightsNotice({
        searchParamsPromise: Promise.resolve({
          notice: "今日目标已更新",
        }),
      }),
    );

    expect(screen.getByText("今日目标已更新")).toBeInTheDocument();
  });
});
