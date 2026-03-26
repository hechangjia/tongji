import { describe, expect, test } from "vitest";
import { pickBannerQuote } from "@/server/services/banner-service";

const activeQuotes = [
  {
    id: "quote-a",
    content: "第一条",
    author: "A",
    status: "ACTIVE" as const,
    createdAt: new Date("2026-03-26T08:00:00.000Z"),
  },
  {
    id: "quote-b",
    content: "第二条",
    author: "B",
    status: "ACTIVE" as const,
    createdAt: new Date("2026-03-26T09:00:00.000Z"),
  },
];

describe("banner service", () => {
  test("returns null when banner is disabled", () => {
    expect(
      pickBannerQuote(activeQuotes, {
        isEnabled: false,
        displayMode: "RANDOM",
      }),
    ).toBeNull();
  });

  test("returns null when there are no active quotes", () => {
    expect(
      pickBannerQuote(
        [
          {
            id: "quote-c",
            content: "停用内容",
            author: null,
            status: "INACTIVE" as const,
            createdAt: new Date("2026-03-26T10:00:00.000Z"),
          },
        ],
        {
          isEnabled: true,
          displayMode: "RANDOM",
        },
      ),
    ).toBeNull();
  });

  test("picks a quote in random mode", () => {
    const picked = pickBannerQuote(
      activeQuotes,
      {
        isEnabled: true,
        displayMode: "RANDOM",
      },
      () => 0.99,
    );

    expect(picked?.id).toBe("quote-b");
  });

  test("returns the earliest active quote in rotate mode", () => {
    const picked = pickBannerQuote(activeQuotes, {
      isEnabled: true,
      displayMode: "ROTATE",
    });

    expect(picked?.id).toBe("quote-a");
  });
});
