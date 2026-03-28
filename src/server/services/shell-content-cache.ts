import { unstable_cache, updateTag } from "next/cache";
import type { ShellAnnouncement, ShellBannerData } from "@/lib/content-types";
import {
  buildBannerShellData,
  getBannerSettings,
  listBannerQuotes,
} from "@/server/services/banner-service";
import {
  listAnnouncementsForAdmin,
  sortVisibleAnnouncements,
} from "@/server/services/announcement-service";

export const SHELL_CONTENT_CACHE_TAG = "shell-content";
export const SHELL_CONTENT_CACHE_REVALIDATE_SECONDS = 60;

type CachedBannerQuote = {
  id: string;
  content: string;
  author: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

type CachedBannerSettings = {
  isEnabled: boolean;
  displayMode: "RANDOM" | "ROTATE";
};

type CachedAnnouncement = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: "ACTIVE" | "INACTIVE";
  publishAt: Date;
  expireAt: Date | null;
};

const cachedBannerSource = unstable_cache(
  async (): Promise<{
    settings: CachedBannerSettings;
    quotes: CachedBannerQuote[];
  }> => {
    const [settings, quotes] = await Promise.all([
      getBannerSettings(),
      listBannerQuotes(),
    ]);

    return {
      settings: {
        isEnabled: settings.isEnabled,
        displayMode: settings.displayMode,
      },
      quotes: quotes.map((quote) => ({
        id: quote.id,
        content: quote.content,
        author: quote.author,
        status: quote.status,
        createdAt: quote.createdAt,
      })),
    };
  },
  ["shell-banner-source"],
  {
    tags: [SHELL_CONTENT_CACHE_TAG],
    revalidate: SHELL_CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

const cachedAnnouncementSource = unstable_cache(
  async (): Promise<CachedAnnouncement[]> => {
    const announcements = await listAnnouncementsForAdmin();

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
      status: announcement.status,
      publishAt: announcement.publishAt,
      expireAt: announcement.expireAt,
    }));
  },
  ["shell-announcement-source"],
  {
    tags: [SHELL_CONTENT_CACHE_TAG],
    revalidate: SHELL_CONTENT_CACHE_REVALIDATE_SECONDS,
  },
);

function formatAnnouncementTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return date.toISOString().slice(0, 16).replace("T", " ");
}

export async function getCachedBannerShellData(
  random: () => number = Math.random,
): Promise<ShellBannerData> {
  const { settings, quotes } = await cachedBannerSource();

  return buildBannerShellData(quotes, settings, random);
}

export async function getCachedVisibleAnnouncements(
  now: Date = new Date(),
): Promise<ShellAnnouncement[]> {
  const announcements = await cachedAnnouncementSource();

  return sortVisibleAnnouncements(announcements, now).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    isPinned: announcement.isPinned,
    publishedLabel: formatAnnouncementTimestamp(announcement.publishAt),
  }));
}

export function refreshShellContent() {
  updateTag(SHELL_CONTENT_CACHE_TAG);
}
