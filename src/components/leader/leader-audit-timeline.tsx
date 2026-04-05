import type { LeaderWorkbenchAuditRow } from "@/server/services/leader-workbench-service";

function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LeaderAuditTimeline({
  items,
}: {
  items: LeaderWorkbenchAuditRow[];
}) {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Audit Trail
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">审计时间线</h2>
        <p className="text-sm leading-7 text-slate-600">
          所有组内重操作都要留下可追责痕迹，重点看谁在什么时间改了什么资源、给出的原因是什么。
        </p>
      </div>

      {items.length > 0 ? (
        <ol className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.operatorUserName ?? "系统"} · {item.resourceType} · {item.actionType}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-slate-500">当前还没有需要展示的审计记录。</p>
      )}
    </section>
  );
}
