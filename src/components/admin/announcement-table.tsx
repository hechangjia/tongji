import { EmptyState } from "@/components/empty-state";
import {
  toggleAnnouncementPinAction,
  toggleAnnouncementStatusAction,
} from "@/app/(admin)/admin/announcements/actions";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: "ACTIVE" | "INACTIVE";
  publishAt: Date;
  expireAt: Date | null;
};

function formatDateTime(value: Date | null) {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "无";
}

export function AnnouncementTable({ rows }: { rows: AnnouncementRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无公告"
        description="创建第一条公告后，登录用户会在工作区顶部看到它。"
      />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-[28px] border border-white/70 bg-white/84 p-5 shadow-[0_20px_52px_rgba(8,47,73,0.08)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {row.isPinned ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    置顶
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold text-slate-950">{row.title}</h3>
              </div>
              <p className="text-sm leading-7 text-slate-600">{row.content}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span>发布时间：{formatDateTime(row.publishAt)}</span>
                <span>过期时间：{formatDateTime(row.expireAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  row.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {row.status === "ACTIVE" ? "启用中" : "已停用"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <form action={toggleAnnouncementStatusAction}>
              <input type="hidden" name="id" value={row.id} />
              <input
                type="hidden"
                name="status"
                value={row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
              >
                {row.status === "ACTIVE" ? "停用" : "启用"}
              </button>
            </form>

            <form action={toggleAnnouncementPinAction}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="isPinned" value={row.isPinned ? "false" : "true"} />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
              >
                {row.isPinned ? "取消置顶" : "设为置顶"}
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
