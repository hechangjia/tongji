import { describe, expect, test } from "vitest";
import {
  isAnnouncementVisible,
  sortVisibleAnnouncements,
} from "@/server/services/announcement-service";

describe("announcement service", () => {
  const now = new Date("2026-03-26T10:00:00.000Z");

  test("hides future announcements", () => {
    expect(
      isAnnouncementVisible(
        {
          status: "ACTIVE",
          publishAt: new Date("2026-03-26T12:00:00.000Z"),
          expireAt: null,
        },
        now,
      ),
    ).toBe(false);
  });

  test("hides expired announcements", () => {
    expect(
      isAnnouncementVisible(
        {
          status: "ACTIVE",
          publishAt: new Date("2026-03-25T12:00:00.000Z"),
          expireAt: new Date("2026-03-26T09:00:00.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  test("sorts pinned announcements before non-pinned ones", () => {
    const sorted = sortVisibleAnnouncements(
      [
        {
          id: "a",
          title: "普通公告",
          content: "A",
          isPinned: false,
          status: "ACTIVE",
          publishAt: new Date("2026-03-26T09:59:00.000Z"),
          expireAt: null,
        },
        {
          id: "b",
          title: "置顶公告",
          content: "B",
          isPinned: true,
          status: "ACTIVE",
          publishAt: new Date("2026-03-26T08:00:00.000Z"),
          expireAt: null,
        },
      ],
      now,
    );

    expect(sorted[0]?.id).toBe("b");
  });
});
