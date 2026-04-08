import { fireEvent, render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AppShellClient } from "@/components/app-shell-client";
import { buildNavSections } from "@/components/app-shell";

const getCachedBannerShellDataMock = vi.hoisted(() => vi.fn());
const getCachedVisibleAnnouncementsMock = vi.hoisted(() => vi.fn());
const prefetchMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: prefetchMock,
  }),
}));

vi.mock("@/server/services/shell-content-cache", () => ({
  getCachedBannerShellData: getCachedBannerShellDataMock,
  getCachedVisibleAnnouncements: getCachedVisibleAnnouncementsMock,
}));

vi.mock("@/components/banner-rotator", () => ({
  BannerRotator: ({ banner }: { banner: unknown }) => (
    <div data-testid="banner-rotator">{banner ? "banner-present" : "banner-empty"}</div>
  ),
}));

vi.mock("@/components/announcement-list", () => ({
  AnnouncementList: ({ announcements = [] }: { announcements?: unknown[] }) => (
    <div data-testid="announcement-list">{announcements.length}</div>
  ),
}));

async function importComponentFromWorkspace(relativePath: string) {
  const moduleUrl = pathToFileURL(`${process.cwd()}/${relativePath}`).href;

  return import(/* @vite-ignore */ moduleUrl);
}

describe("app shell", () => {
  test("renders as a minimal client shell without next navigation hook dependency", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/app-shell-client.tsx`, "utf8"),
    );

    expect(source).not.toContain("usePathname");
  });

  test("keeps the shared shell itself free of local menu state", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/app-shell-client.tsx`, "utf8"),
    );

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("useState");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getCachedBannerShellDataMock.mockResolvedValue({
      mode: "RANDOM",
      items: [{ id: "banner-1", content: "今日文案", author: "Maika" }],
    });
    getCachedVisibleAnnouncementsMock.mockResolvedValue([
      {
        id: "notice-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        publishedLabel: "2026-04-08 09:00",
      },
    ]);
  });

  test("shows grouped member navigation and mobile trigger", () => {
    expect(buildNavSections("MEMBER")[0]?.items).toEqual(
      expect.arrayContaining([{ label: "小组榜单", href: "/leaderboard/groups" }]),
    );

    render(
      <AppShellClient
        role="MEMBER"
        userName="member01"
        currentPath="/entry"
        navSections={buildNavSections("MEMBER")}
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
      >
        内容
      </AppShellClient>,
    );

    expect(screen.getByText("成员区")).toBeInTheDocument();
    expect(screen.getByText("管理区")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "管理员功能" })).toBeInTheDocument();
  });

  test("prefetches admin destinations on navigation intent without warming member links", () => {
    render(
      <AppShellClient
        role="ADMIN"
        userName="admin"
        currentPath="/admin"
        navSections={buildNavSections("ADMIN")}
      >
        内容
      </AppShellClient>,
    );

    fireEvent.mouseEnter(screen.getByRole("link", { name: "成员管理" }));

    expect(prefetchMock).toHaveBeenCalledWith("/admin/members");

    prefetchMock.mockClear();

    fireEvent.mouseEnter(screen.getByRole("link", { name: "今日录入" }));

    expect(prefetchMock).not.toHaveBeenCalled();
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
      >
        内容
      </AppShellClient>,
    );

    expect(screen.getAllByText("组长")).not.toHaveLength(0);
    expect(screen.getByText("组长带队模式")).toBeInTheDocument();
  });

  test("renders banner and announcements in the server shell instead of passing them into AppShellClient", async () => {
    const { AppShell } = await importComponentFromWorkspace("src/components/app-shell.tsx");

    render(
      await AppShell({
        role: "MEMBER",
        userName: "member01",
        currentPath: "/entry",
        children: <div>内容</div>,
      }),
    );

    expect(getCachedBannerShellDataMock).toHaveBeenCalledTimes(1);
    expect(getCachedVisibleAnnouncementsMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("内容")).toBeInTheDocument();
  });
});
