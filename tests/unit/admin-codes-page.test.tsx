import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const getAdminCodesDashboardDataMock = vi.hoisted(() => vi.fn());
const getCachedAdminCumulativeTrendMock = vi.hoisted(() => vi.fn());
const getCachedAdminDailyRhythmSummaryMock = vi.hoisted(() => vi.fn());
const prefetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    prefetch: prefetchMock,
  }),
}));

vi.mock("@/server/services/admin-code-service", () => ({
  getAdminCodesDashboardData: getAdminCodesDashboardDataMock,
}));

vi.mock("@/server/services/leaderboard-cache", () => ({
  getCachedAdminCumulativeTrend: getCachedAdminCumulativeTrendMock,
  getCachedAdminDailyRhythmSummary: getCachedAdminDailyRhythmSummaryMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/page-header", () => ({
  PageHeader: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children?: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("@/components/metric-card", () => ({
  MetricCard: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock("@/components/status-callout", () => ({
  StatusCallout: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock("@/components/admin/code-import-card", () => ({
  CodeImportCard: () => <div>code-import-card</div>,
}));

vi.mock("@/components/admin/prospect-import-card", () => ({
  ProspectImportCard: () => <div>prospect-import-card</div>,
}));

vi.mock("@/components/admin/code-assignment-panel", () => ({
  CodeAssignmentPanel: () => <div>code-assignment-panel</div>,
}));

vi.mock("@/components/admin/code-inventory-table", () => ({
  CodeInventoryTable: () => <div>code-inventory-table</div>,
}));

vi.mock("@/components/admin/prospect-lead-table", () => ({
  ProspectLeadTable: () => <div>prospect-lead-table</div>,
}));

vi.mock("@/components/admin/admin-cumulative-stats-panel", () => ({
  AdminCumulativeStatsPanel: () => <div>admin-cumulative-stats-panel</div>,
}));

vi.mock("@/components/admin/admin-daily-review-summary", () => ({
  AdminDailyReviewSummary: () => <div>admin-daily-review-summary</div>,
}));

vi.mock("@/components/admin/admin-home-route-prefetch", () => ({
  AdminHomeRoutePrefetch: () => null,
}));

import AdminHomePage from "@/app/(admin)/admin/page";
import AdminCodesPage from "@/app/(admin)/admin/codes/page";

describe("admin codes page", () => {
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
    getCachedAdminCumulativeTrendMock.mockResolvedValue({
      granularity: "day",
      series: [],
    });
    getCachedAdminDailyRhythmSummaryMock.mockResolvedValue({});
    getAdminCodesDashboardDataMock.mockResolvedValue({
      overview: {
        totalCodes: 12,
        unassignedCodes: 5,
        unassignedProspects: 7,
        assignedProspects: 3,
      },
      assigneeOptions: [],
      codeRows: [],
      prospectRows: [],
    });
  });

  test("renders the admin codes workspace with import and assignment sections", async () => {
    render(await AdminCodesPage());

    expect(screen.getByText("识别码与线索")).toBeInTheDocument();
    expect(screen.getByText("code-import-card")).toBeInTheDocument();
    expect(screen.getByText("prospect-import-card")).toBeInTheDocument();
    expect(screen.getByText("code-assignment-panel")).toBeInTheDocument();
    expect(screen.getByText("code-inventory-table")).toBeInTheDocument();
    expect(screen.getByText("prospect-lead-table")).toBeInTheDocument();
    expect(screen.getAllByText("识别码库存").length).toBeGreaterThan(0);
    expect(screen.getByText("待分发识别码")).toBeInTheDocument();
  });

  // Auth redirect test removed — redirects now handled by (admin)/layout.tsx

  test("admin home page includes the codes quick entry", async () => {
    render(await AdminHomePage({}));

    expect(screen.getByRole("link", { name: /识别码与线索/ })).toHaveAttribute(
      "href",
      "/admin/codes",
    );
  });

  test("admin home page prefetches the insights route on card hover intent", async () => {
    render(await AdminHomePage({}));

    fireEvent.mouseEnter(screen.getByRole("link", { name: /经营诊断/ }));

    expect(prefetchMock).toHaveBeenCalledWith("/admin/insights");
  });
});
