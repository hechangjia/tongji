import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const listGroupsForAdminMock = vi.hoisted(() => vi.fn());
const listLeaderCandidatesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/services/group-service", () => ({
  listGroupsForAdmin: listGroupsForAdminMock,
  listLeaderCandidates: listLeaderCandidatesMock,
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin/group-form", () => ({
  GroupForm: () => <div>create-group-form</div>,
}));

vi.mock("@/components/admin/group-table", () => ({
  GroupTable: ({ rows }: { rows: Array<{ id: string; name: string }> }) => (
    <div>
      {rows.map((row) => (
        <span key={row.id}>{row.name}</span>
      ))}
    </div>
  ),
}));

import AdminGroupsPage from "@/app/(admin)/admin/groups/page";

describe("admin groups page", () => {
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
    listLeaderCandidatesMock.mockResolvedValue([]);
    listGroupsForAdminMock.mockResolvedValue([
      {
        id: "group-1",
        name: "一组",
        slogan: "冲刺",
        remark: null,
        leaderUserId: null,
        leader: null,
        memberCount: 0,
        createdAt: new Date("2026-03-27T00:00:00.000Z"),
      },
    ]);
  });

  test("admin groups page renders create form and existing rows", async () => {
    render(await AdminGroupsPage());

    expect(screen.getByText("小组管理")).toBeInTheDocument();
    expect(screen.getByText("create-group-form")).toBeInTheDocument();
    expect(screen.getByText("一组")).toBeInTheDocument();
  });
});
