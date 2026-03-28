import { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ShellAnnouncement } from "@/lib/content-types";
import {
  announcementSchema,
  type AnnouncementInput,
} from "@/lib/validators/announcement";

type AnnouncementLike = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: "ACTIVE" | "INACTIVE";
  publishAt: Date | string;
  expireAt: Date | string | null;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function formatAnnouncementTimestamp(value: Date | string) {
  return toDate(value).toISOString().slice(0, 16).replace("T", " ");
}

export function isAnnouncementVisible(
  announcement: Pick<AnnouncementLike, "status" | "publishAt" | "expireAt">,
  now: Date = new Date(),
) {
  const publishAt = toDate(announcement.publishAt);
  const expireAt = announcement.expireAt ? toDate(announcement.expireAt) : null;

  return (
    announcement.status === "ACTIVE" &&
    publishAt.getTime() <= now.getTime() &&
    (!expireAt || expireAt.getTime() >= now.getTime())
  );
}

export function sortVisibleAnnouncements<T extends AnnouncementLike>(
  announcements: T[],
  now: Date = new Date(),
) {
  return [...announcements]
    .filter((announcement) => isAnnouncementVisible(announcement, now))
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return Number(right.isPinned) - Number(left.isPinned);
      }

      return toDate(right.publishAt).getTime() - toDate(left.publishAt).getTime();
    });
}

export async function listAnnouncementsForAdmin() {
  return db.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { publishAt: "desc" }],
  });
}

export async function getVisibleAnnouncements(
  now: Date = new Date(),
): Promise<ShellAnnouncement[]> {
  const announcements = await listAnnouncementsForAdmin();

  return sortVisibleAnnouncements(
    announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
      status: announcement.status,
      publishAt: announcement.publishAt,
      expireAt: announcement.expireAt,
    })),
    now,
  ).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    isPinned: announcement.isPinned,
    publishedLabel: formatAnnouncementTimestamp(announcement.publishAt),
  }));
}

export async function createAnnouncement(input: AnnouncementInput) {
  const parsedInput = announcementSchema.parse(input);

  return db.announcement.create({
    data: {
      title: parsedInput.title,
      content: parsedInput.content,
      isPinned: parsedInput.isPinned,
      status: parsedInput.status,
      publishAt: new Date(parsedInput.publishAt),
      expireAt: parsedInput.expireAt ? new Date(parsedInput.expireAt) : null,
    },
  });
}

export async function toggleAnnouncementStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
) {
  return db.announcement.update({
    where: { id },
    data: {
      status: status === "ACTIVE" ? ContentStatus.ACTIVE : ContentStatus.INACTIVE,
    },
  });
}

export async function toggleAnnouncementPin(id: string, isPinned: boolean) {
  return db.announcement.update({
    where: { id },
    data: {
      isPinned,
    },
  });
}
