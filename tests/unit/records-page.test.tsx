import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const getCachedMemberRecordsMock = vi.hoisted(() => vi.fn());
const getIdentifierSalesForUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/member-records-cache", () => ({
  getCachedMemberRecords: getCachedMemberRecordsMock,
}));

vi.mock("@/server/services/member-identifier-sale-service", () => ({
  getIdentifierSalesForUser: getIdentifierSalesForUserMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
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
  MetricCard: ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock("@/components/my-records-table", () => ({
  MyRecordsTable: ({
    rows,
    identifierSales,
  }: {
    rows: Array<{ id: string }>;
    identifierSales: Array<{ id: string }>;
  }) => (
    <div>{`my-records-table:${rows.length}:${identifierSales.length}`}</div>
  ),
}));

import RecordsPage from "@/app/(member)/records/page";

describe("records page", () => {
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
    getCachedMemberRecordsMock.mockResolvedValue([
      {
        id: "record-1",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        count40: 3,
        count60: 1,
        remark: "地推",
      },
    ]);
    getIdentifierSalesForUserMock.mockResolvedValue([
      {
        id: "sale-1",
        planType: "PLAN_40",
        saleDate: new Date("2026-03-27T00:00:00.000Z"),
        createdAt: new Date("2026-03-27T10:00:00.000Z"),
        code: {
          code: "A001",
        },
        prospectLead: {
          qqNumber: "123456",
          major: "计算机",
          sourceType: "ADMIN_IMPORT",
        },
      },
    ]);
  });

  test("uses cached member records for the initial page payload", async () => {
    render(await RecordsPage());

    expect(getCachedMemberRecordsMock).toHaveBeenCalledWith("member-1");
    expect(getIdentifierSalesForUserMock).toHaveBeenCalledWith("member-1");
    expect(screen.getByText("我的记录")).toBeInTheDocument();
    expect(screen.getByText("my-records-table:1:1")).toBeInTheDocument();
    expect(screen.getByText("记录条数")).toBeInTheDocument();
    expect(screen.getByText("累计销量")).toBeInTheDocument();
  });
});
