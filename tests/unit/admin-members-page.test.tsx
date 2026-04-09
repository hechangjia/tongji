import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const getCachedSessionMock = vi.hoisted(() => vi.fn());
const findManyUserMock = vi.hoisted(() => vi.fn());
const findManyGroupMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-request-cache", () => ({
  getCachedSession: getCachedSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: findManyUserMock,
    },
    group: {
      findMany: findManyGroupMock,
    },
  },
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

vi.mock("@/components/admin/member-form", () => ({
  MemberForm: () => <div>member-form</div>,
}));

vi.mock("@/components/admin/member-table", () => ({
  MemberTable: () => <div>member-table</div>,
}));

import AdminMembersPage, {
  AdminMembersContent,
  AdminMembersHeaderMetrics,
  AdminMembersNotice,
} from "@/app/(admin)/admin/members/page";
import type { Role, UserStatus } from "@prisma/client";

const baseMembersPageData = {
  members: [
    {
      id: "member-1",
      username: "member01",
      name: "成员一号",
      role: "MEMBER" as Role,
      groupId: "group-1" as string | null,
      remark: null as string | null,
      status: "ACTIVE" as UserStatus,
      createdAt: new Date("2026-03-27T00:00:00.000Z"),
      group: {
        name: "北极星组",
      } as { name: string } | null,
    },
  ],
  groups: [
    {
      id: "group-1",
      name: "北极星组",
    },
  ],
  activeMembers: 1,
  adminMembers: 0,
};

describe("admin members page", () => {
  test("exports a deferred content section so the page shell can stream first", async () => {
    const module = await import("@/app/(admin)/admin/members/page");

    expect(module).toHaveProperty("AdminMembersContent");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getCachedSessionMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        username: "admin",
        name: "管理员",
      },
    });
    findManyUserMock.mockResolvedValue(baseMembersPageData.members);
    findManyGroupMock.mockResolvedValue(baseMembersPageData.groups);
  });

  test("renders the admin members shell immediately", async () => {
    render(await AdminMembersPage({}));

    expect(screen.getByText("成员管理")).toBeInTheDocument();
  });

  test("does not block the admin members shell on unresolved search params", () => {
    render(
      AdminMembersPage({
        searchParams: new Promise(() => {}),
      }) as unknown as React.ReactElement,
    );

    expect(screen.getByText("成员管理")).toBeInTheDocument();
  });

  test("renders deferred member metrics and management content", async () => {
    render(
      await AdminMembersHeaderMetrics({
        dataPromise: Promise.resolve(baseMembersPageData),
      }),
    );
    render(
      await AdminMembersContent({
        dataPromise: Promise.resolve(baseMembersPageData),
        currentAdminIdPromise: Promise.resolve("admin-1"),
      }),
    );

    expect(screen.getByText("member-form")).toBeInTheDocument();
    expect(screen.getByText("member-table")).toBeInTheDocument();
    expect(screen.getByText("成员总数")).toBeInTheDocument();
  });

  test("renders action notice from deferred search params", async () => {
    render(
      await AdminMembersNotice({
        searchParamsPromise: Promise.resolve({
          notice: "成员已更新",
          noticeTone: "success",
        }),
      }),
    );

    expect(screen.getByText("成员已更新")).toBeInTheDocument();
  });
});
