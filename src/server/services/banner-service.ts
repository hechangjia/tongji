import { BannerDisplayMode, ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ShellBannerData, ShellBannerItem } from "@/lib/content-types";
import {
  bannerQuoteSchema,
  bannerSettingsSchema,
  type BannerQuoteInput,
  type BannerSettingsInput,
} from "@/lib/validators/banner";

type BannerQuoteLike = {
  id: string;
  content: string;
  author: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date | string;
};

type BannerSettingsLike = {
  isEnabled: boolean;
  displayMode: "RANDOM" | "ROTATE";
};

function toTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function normalizeActiveBannerQuotes(quotes: BannerQuoteLike[]): ShellBannerItem[] {
  return quotes
    .filter((quote) => quote.status === "ACTIVE")
    .sort((left, right) => toTimestamp(left.createdAt) - toTimestamp(right.createdAt))
    .map((quote) => ({
      id: quote.id,
      content: quote.content,
      author: quote.author,
    }));
}

export function pickBannerQuote(
  quotes: BannerQuoteLike[],
  settings: BannerSettingsLike,
  random: () => number = Math.random,
): ShellBannerItem | null {
  if (!settings.isEnabled) {
    return null;
  }

  const activeQuotes = normalizeActiveBannerQuotes(quotes);

  if (activeQuotes.length === 0) {
    return null;
  }

  if (settings.displayMode === "ROTATE") {
    return activeQuotes[0] ?? null;
  }

  const selectedIndex = Math.min(
    activeQuotes.length - 1,
    Math.floor(random() * activeQuotes.length),
  );

  return activeQuotes[selectedIndex] ?? null;
}

export function buildBannerShellData(
  quotes: BannerQuoteLike[],
  settings: BannerSettingsLike,
  random: () => number = Math.random,
): ShellBannerData {
  if (!settings.isEnabled) {
    return null;
  }

  const activeQuotes = normalizeActiveBannerQuotes(quotes);

  if (activeQuotes.length === 0) {
    return null;
  }

  if (settings.displayMode === "ROTATE") {
    return {
      mode: "ROTATE",
      items: activeQuotes,
    };
  }

  const picked = pickBannerQuote(quotes, settings, random);

  if (!picked) {
    return null;
  }

  return {
    mode: "RANDOM",
    items: [picked],
  };
}

export async function getBannerSettings() {
  return db.bannerSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      isEnabled: true,
      displayMode: BannerDisplayMode.RANDOM,
    },
  });
}

export async function listBannerQuotes() {
  return db.bannerQuote.findMany({
    orderBy: [{ sourceType: "asc" }, { createdAt: "asc" }],
  });
}

export async function getBannerShellData(
  random: () => number = Math.random,
): Promise<ShellBannerData> {
  const [settings, quotes] = await Promise.all([
    getBannerSettings(),
    listBannerQuotes(),
  ]);

  return buildBannerShellData(
    quotes.map((quote) => ({
      id: quote.id,
      content: quote.content,
      author: quote.author,
      status: quote.status,
      createdAt: quote.createdAt,
    })),
    {
      isEnabled: settings.isEnabled,
      displayMode: settings.displayMode,
    },
    random,
  );
}

export async function createBannerQuote(input: BannerQuoteInput) {
  const parsedInput = bannerQuoteSchema.parse(input);

  return db.bannerQuote.create({
    data: {
      content: parsedInput.content,
      author: parsedInput.author || null,
      sourceType: parsedInput.sourceType,
      status: parsedInput.status,
    },
  });
}

export async function updateBannerSettings(input: BannerSettingsInput) {
  const parsedInput = bannerSettingsSchema.parse(input);

  return db.bannerSettings.upsert({
    where: { id: "default" },
    update: parsedInput,
    create: {
      id: "default",
      ...parsedInput,
    },
  });
}

export async function toggleBannerQuoteStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  return db.bannerQuote.update({
    where: { id },
    data: {
      status: status === "ACTIVE" ? ContentStatus.ACTIVE : ContentStatus.INACTIVE,
    },
  });
}
