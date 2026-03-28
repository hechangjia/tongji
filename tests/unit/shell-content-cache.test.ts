import { beforeEach, describe, expect, test, vi } from "vitest";

const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback: (...args: unknown[]) => unknown) => callback),
);
const updateTagMock = vi.hoisted(() => vi.fn());
const getBannerSettingsMock = vi.hoisted(() => vi.fn());
const listBannerQuotesMock = vi.hoisted(() => vi.fn());
const buildBannerShellDataMock = vi.hoisted(() => vi.fn());
const listAnnouncementsForAdminMock = vi.hoisted(() => vi.fn());
const sortVisibleAnnouncementsMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
  updateTag: updateTagMock,
}));

vi.mock("@/server/services/banner-service", () => ({
  getBannerSettings: getBannerSettingsMock,
  listBannerQuotes: listBannerQuotesMock,
  buildBannerShellData: buildBannerShellDataMock,
}));

vi.mock("@/server/services/announcement-service", () => ({
  listAnnouncementsForAdmin: listAnnouncementsForAdminMock,
  sortVisibleAnnouncements: sortVisibleAnnouncementsMock,
}));

import {
  SHELL_CONTENT_CACHE_REVALIDATE_SECONDS,
  SHELL_CONTENT_CACHE_TAG,
  getCachedBannerShellData,
  getCachedVisibleAnnouncements,
  refreshShellContent,
} from "@/server/services/shell-content-cache";

describe("shell content cache", () => {
  beforeEach(() => {
    updateTagMock.mockClear();
    getBannerSettingsMock.mockClear();
    listBannerQuotesMock.mockClear();
    buildBannerShellDataMock.mockClear();
    listAnnouncementsForAdminMock.mockClear();
    sortVisibleAnnouncementsMock.mockClear();
  });

  test("wraps shell banner and announcement sources in Next cache with shared tag", () => {
    expect(unstableCacheMock).toHaveBeenCalledTimes(2);
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      ["shell-banner-source"],
      {
        tags: [SHELL_CONTENT_CACHE_TAG],
        revalidate: SHELL_CONTENT_CACHE_REVALIDATE_SECONDS,
      },
    );
    expect(unstableCacheMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      ["shell-announcement-source"],
      {
        tags: [SHELL_CONTENT_CACHE_TAG],
        revalidate: SHELL_CONTENT_CACHE_REVALIDATE_SECONDS,
      },
    );
  });

  test("delegates cached shell data reads to the underlying services", async () => {
    getBannerSettingsMock.mockResolvedValue({
      isEnabled: true,
      displayMode: "RANDOM",
    });
    listBannerQuotesMock.mockResolvedValue([
      {
        id: "quote-1",
        content: "今天继续推进",
        author: "管理员",
        status: "ACTIVE",
        createdAt: new Date("2026-03-27T09:00:00.000Z"),
      },
    ]);
    buildBannerShellDataMock.mockReturnValue({
      mode: "RANDOM",
      items: [{ id: "quote-1", content: "今天继续推进", author: "管理员" }],
    });
    listAnnouncementsForAdminMock.mockResolvedValue([
      {
        id: "announcement-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        status: "ACTIVE",
        publishAt: new Date("2026-03-27T08:00:00.000Z"),
        expireAt: null,
      },
    ]);
    sortVisibleAnnouncementsMock.mockReturnValue([
      {
        id: "announcement-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        status: "ACTIVE",
        publishAt: new Date("2026-03-27T08:00:00.000Z"),
        expireAt: null,
      },
    ]);

    await expect(getCachedBannerShellData(() => 0.3)).resolves.toEqual({
      mode: "RANDOM",
      items: [{ id: "quote-1", content: "今天继续推进", author: "管理员" }],
    });
    await expect(
      getCachedVisibleAnnouncements(new Date("2026-03-27T10:00:00.000Z")),
    ).resolves.toEqual([
      {
        id: "announcement-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        publishedLabel: "2026-03-27 08:00",
      },
    ]);

    expect(getBannerSettingsMock).toHaveBeenCalledTimes(1);
    expect(listBannerQuotesMock).toHaveBeenCalledTimes(1);
    expect(buildBannerShellDataMock).toHaveBeenCalledWith(
      [
        {
          id: "quote-1",
          content: "今天继续推进",
          author: "管理员",
          status: "ACTIVE",
          createdAt: new Date("2026-03-27T09:00:00.000Z"),
        },
      ],
      {
        isEnabled: true,
        displayMode: "RANDOM",
      },
      expect.any(Function),
    );
    expect(listAnnouncementsForAdminMock).toHaveBeenCalledTimes(1);
    expect(sortVisibleAnnouncementsMock).toHaveBeenCalledWith(
      [
        {
          id: "announcement-1",
          title: "公告",
          content: "内容",
          isPinned: true,
          status: "ACTIVE",
          publishAt: new Date("2026-03-27T08:00:00.000Z"),
          expireAt: null,
        },
      ],
      new Date("2026-03-27T10:00:00.000Z"),
    );
  });

  test("refreshes the shared shell content tag", () => {
    refreshShellContent();

    expect(updateTagMock).toHaveBeenCalledWith(SHELL_CONTENT_CACHE_TAG);
  });

  test("formats announcement timestamps even when cached values are serialized strings", async () => {
    getBannerSettingsMock.mockResolvedValue({
      isEnabled: true,
      displayMode: "RANDOM",
    });
    listBannerQuotesMock.mockResolvedValue([]);
    buildBannerShellDataMock.mockReturnValue(null);
    listAnnouncementsForAdminMock.mockResolvedValue([]);
    sortVisibleAnnouncementsMock.mockReturnValue([
      {
        id: "announcement-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        status: "ACTIVE",
        publishAt: "2026-03-27T08:00:00.000Z",
        expireAt: null,
      },
    ]);

    await expect(
      getCachedVisibleAnnouncements(new Date("2026-03-27T10:00:00.000Z")),
    ).resolves.toEqual([
      {
        id: "announcement-1",
        title: "公告",
        content: "内容",
        isPinned: true,
        publishedLabel: "2026-03-27 08:00",
      },
    ]);
  });
});
