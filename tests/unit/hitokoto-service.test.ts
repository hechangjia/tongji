import { describe, expect, test, vi } from "vitest";
import {
  buildHitokotoBannerDraft,
  fetchHitokotoBannerDraft,
} from "@/server/services/hitokoto-service";

describe("hitokoto service", () => {
  test("builds a local banner draft from a hitokoto payload", () => {
    const draft = buildHitokotoBannerDraft({
      hitokoto: "重要的不是治愈，而是带着病痛活下去。",
      from: "银魂",
      from_who: "坂田银时",
    });

    expect(draft).toEqual({
      content: "重要的不是治愈，而是带着病痛活下去。",
      author: "坂田银时《银魂》",
      sourceType: "CUSTOM",
      status: "INACTIVE",
    });
  });

  test("fetches hitokoto from the official API and normalizes it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hitokoto: "真正重要的东西，总是没有的人比拥有的人清楚。",
        from: "银魂",
        from_who: null,
      }),
    });

    await expect(fetchHitokotoBannerDraft(fetchMock)).resolves.toEqual({
      content: "真正重要的东西，总是没有的人比拥有的人清楚。",
      author: "银魂",
      sourceType: "CUSTOM",
      status: "INACTIVE",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://v1.hitokoto.cn/"),
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });
});
