import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const getAdminSalesReviewDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/daily-rhythm-service", () => ({
  getAdminSalesReviewData: getAdminSalesReviewDataMock,
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
    description: string;
    children?: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  ),
}));

vi.mock("@/components/metric-card", () => ({
  MetricCard: ({ label, value }: { label: string; value: string | number }) => (
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

vi.mock("@/components/admin/admin-daily-review-summary", () => ({
  AdminDailyReviewSummary: ({ summary }: { summary: { message: string } }) => (
    <div>{summary.message}</div>
  ),
}));

vi.mock("@/components/admin/sales-table", () => ({
  SalesTable: ({
    rows,
    returnTo,
  }: {
    rows: Array<{ id: string; userName: string }>;
    returnTo: string;
  }) => (
    <div>
      <div>{returnTo}</div>
      {rows.map((row) => (
        <span key={row.id}>{row.userName}</span>
      ))}
    </div>
  ),
}));

import AdminSalesPage from "@/app/(admin)/admin/sales/page";

describe("admin sales page", () => {
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
    getAdminSalesReviewDataMock.mockResolvedValue({
      summary: {
        message: "当前查看历史记录",
        pendingCount: 1,
      },
      rows: [
        {
          id: "record-1",
          userName: "成员1",
        },
      ],
    });
  });

  test("passes the selected historical date into the admin review query instead of forcing today", async () => {
    render(
      await AdminSalesPage({
        searchParams: Promise.resolve({
          date: "2026-03-26",
          keyword: "成员",
        }),
      }),
    );

    expect(getAdminSalesReviewDataMock).toHaveBeenCalledWith({
      keyword: "成员",
      todaySaleDate: "2026-03-26",
    });
    expect(screen.getByDisplayValue("2026-03-26")).toBeInTheDocument();
    expect(screen.getByText("/admin/sales?date=2026-03-26&keyword=%E6%88%90%E5%91%98")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
