import { describe, expect, test } from "vitest";
import {
  announcementSchema,
} from "@/lib/validators/announcement";
import { bannerQuoteSchema } from "@/lib/validators/banner";

describe("content validators", () => {
  test("requires banner content", () => {
    expect(() =>
      bannerQuoteSchema.parse({
        content: "",
        author: "",
        sourceType: "CUSTOM",
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  test("rejects announcements whose expire date is before publish date", () => {
    expect(() =>
      announcementSchema.parse({
        title: "测试公告",
        content: "需要在全站展示的公告内容",
        isPinned: "on",
        status: "ACTIVE",
        publishAt: "2026-03-26T12:00",
        expireAt: "2026-03-25T12:00",
      }),
    ).toThrow("过期时间不能早于发布时间");
  });
});
