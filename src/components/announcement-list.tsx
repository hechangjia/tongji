"use client";

import type { ShellAnnouncement } from "@/lib/content-types";

export function AnnouncementList({
  announcements,
}: {
  announcements: ShellAnnouncement[];
}) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-sky-200/70 bg-white/82 px-5 py-4 shadow-[0_16px_40px_rgba(8,47,73,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Announcements
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">全体公告</h2>
        </div>
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-800">
          {announcements.length} 条
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {announcements.slice(0, 3).map((announcement) => (
          <article
            key={announcement.id}
            className={`rounded-[20px] border px-4 py-4 ${
              announcement.isPinned
                ? "border-cyan-300/50 bg-cyan-50/70"
                : "border-slate-200/80 bg-slate-50/90"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {announcement.isPinned ? (
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white">
                  置顶
                </span>
              ) : null}
              <h3 className="text-sm font-semibold text-slate-950">
                {announcement.title}
              </h3>
              <span className="text-xs text-slate-500">{announcement.publishedLabel}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
