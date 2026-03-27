import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AppShellClient } from "@/components/app-shell-client";
import { buildNavSections } from "@/components/app-shell";

vi.mock("@/server/services/announcement-service", () => ({
  getVisibleAnnouncements: vi.fn(),
}));

vi.mock("@/server/services/banner-service", () => ({
  getBannerShellData: vi.fn(),
}));

test("shows grouped member navigation and mobile trigger", () => {
  expect(buildNavSections("MEMBER")[0]?.items).toEqual(
    expect.arrayContaining([
      { label: "小组榜单", href: "/leaderboard/groups" },
    ]),
  );

  render(
    <AppShellClient
      role="MEMBER"
      userName="member01"
      currentPath="/entry"
      navSections={buildNavSections("MEMBER")}
      banner={null}
      announcements={[]}
    >
      内容
    </AppShellClient>,
  );

  expect(screen.getByText("成员区")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "今日录入" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "日榜" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "总榜" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "小组榜单" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "打开导航菜单" })).toBeInTheDocument();
});

test("shows member and admin navigation groups for admins", () => {
  render(
    <AppShellClient
      role="ADMIN"
      userName="admin"
      currentPath="/admin"
      navSections={[
        {
          title: "成员区",
          items: [
            { label: "今日录入", href: "/entry" },
            { label: "我的记录", href: "/records" },
          ],
        },
        {
          title: "管理区",
          items: [
            { label: "管理员功能", href: "/admin" },
            { label: "成员管理", href: "/admin/members" },
          ],
        },
      ]}
      banner={null}
      announcements={[]}
    >
      内容
    </AppShellClient>,
  );

  expect(screen.getByText("成员区")).toBeInTheDocument();
  expect(screen.getByText("管理区")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "管理员功能" })).toBeInTheDocument();
});

test("builds leader navigation without member-only links", () => {
  expect(buildNavSections("LEADER")).toEqual([
    {
      title: "组长区",
      items: [
        { label: "小组看板", href: "/leader/group" },
        { label: "小组销售", href: "/leader/sales" },
        { label: "小组榜单", href: "/leaderboard/groups" },
      ],
    },
  ]);

  render(
    <AppShellClient
      role="LEADER"
      userName="leader01"
      currentPath="/leader/group"
      navSections={buildNavSections("LEADER")}
      banner={null}
      announcements={[]}
    >
      内容
    </AppShellClient>,
  );

  expect(screen.getByText("组长区")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "小组看板" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "小组销售" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "今日录入" })).not.toBeInTheDocument();
});

test("shows leader-specific fallback identity copy", () => {
  render(
    <AppShellClient
      role="LEADER"
      currentPath="/leader/group"
      navSections={buildNavSections("LEADER")}
      banner={null}
      announcements={[]}
    >
      内容
    </AppShellClient>,
  );

  expect(screen.getAllByText("组长")).not.toHaveLength(0);
  expect(screen.getByText("组长带队模式")).toBeInTheDocument();
});
