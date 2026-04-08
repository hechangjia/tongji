import { render, screen } from "@testing-library/react";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";

const getCachedBannerShellDataMock = vi.hoisted(() => vi.fn());
const getCachedVisibleAnnouncementsMock = vi.hoisted(() => vi.fn());
const appShellClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/shell-content-cache", () => ({
  getCachedBannerShellData: getCachedBannerShellDataMock,
  getCachedVisibleAnnouncements: getCachedVisibleAnnouncementsMock,
}));

vi.mock("@/components/banner-rotator", () => ({
  BannerRotator: () => <div data-testid="banner-rotator">banner</div>,
}));

vi.mock("@/components/announcement-list", () => ({
  AnnouncementList: () => <div data-testid="announcement-list">announcements</div>,
}));

vi.mock("@/components/app-shell-client", () => ({
  AppShellClient: (props: Record<string, unknown>) => {
    appShellClientMock(props);
    return (
      <div data-testid="app-shell-client">
        {props.topSlot as React.ReactNode}
        {props.children as React.ReactNode}
      </div>
    );
  },
}));

async function importComponentFromWorkspace(relativePath: string) {
  const moduleUrl = pathToFileURL(`${process.cwd()}/${relativePath}`).href;

  return import(/* @vite-ignore */ moduleUrl);
}

describe("app shell server wrapper", () => {
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

  test("renders banner and announcements via topSlot instead of passing them to AppShellClient props", async () => {
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
    expect(screen.getByTestId("app-shell-client")).toBeInTheDocument();
    expect(appShellClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "MEMBER",
        userName: "member01",
        currentPath: "/entry",
        navSections: expect.any(Array),
        topSlot: expect.anything(),
      }),
    );
    expect(appShellClientMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        banner: expect.anything(),
      }),
    );
    expect(appShellClientMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        announcements: expect.anything(),
      }),
    );
  });

  test("does not block the shell on unresolved banner and announcement reads", async () => {
    getCachedBannerShellDataMock.mockReturnValue(new Promise(() => {}));
    getCachedVisibleAnnouncementsMock.mockReturnValue(new Promise(() => {}));
    const { AppShell } = await importComponentFromWorkspace("src/components/app-shell.tsx");

    render(
      AppShell({
        role: "MEMBER",
        userName: "member01",
        currentPath: "/entry",
        children: <div>内容</div>,
      }) as unknown as React.ReactElement,
    );

    expect(screen.getByText("内容")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-client")).toBeInTheDocument();
  });
});
