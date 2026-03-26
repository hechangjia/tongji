import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AppShellClient } from "@/components/app-shell-client";

test("shows grouped member navigation and mobile trigger", () => {
  render(
    <AppShellClient
      role="MEMBER"
      userName="member01"
      currentPath="/entry"
      navSections={[
        {
          title: "成员区",
          items: [
            { label: "今日录入", href: "/entry" },
            { label: "我的记录", href: "/records" },
            { label: "日榜", href: "/leaderboard/daily" },
            { label: "总榜", href: "/leaderboard/range" },
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
  expect(screen.getByRole("link", { name: "今日录入" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "日榜" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "总榜" })).toBeInTheDocument();
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
