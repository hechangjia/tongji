import { reassignIdentifierCodeAction } from "@/app/(leader)/leader/sales/actions";
import type {
  LeaderWorkbenchCodePoolRow,
  LeaderWorkbenchMemberRow,
} from "@/server/services/leader-workbench-service";

function formatDateTime(value: Date | null) {
  if (!value) {
    return "暂无分配时间";
  }

  return value.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LeaderCodeAssignmentSection({
  items,
  memberOptions,
}: {
  items: LeaderWorkbenchCodePoolRow[];
  memberOptions: LeaderWorkbenchMemberRow[];
}) {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Code Dispatch
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">识别码调度区</h2>
        <p className="text-sm leading-7 text-slate-600">
          展示组内可调度识别码，支持组长在本组内改派，或把暂时闲置的码回收到组池。
        </p>
      </div>

      {items.length > 0 ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.code}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    当前持有人：{item.currentOwnerName ?? "组池待分配"} · 最近分配时间：{formatDateTime(item.assignedAt)}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-700">
                  {item.isInGroupPool ? "GROUP POOL" : "ASSIGNED"}
                </p>
              </div>

              <form action={reassignIdentifierCodeAction} className="mt-4 grid gap-3 rounded-[18px] border border-white bg-white p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input type="hidden" name="codeId" value={item.id} readOnly />
                <select
                  name="nextOwnerUserId"
                  defaultValue={item.currentOwnerUserId ?? ""}
                  className="rounded-[14px] border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                >
                  <option value="">退回组池</option>
                  {memberOptions.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName}
                    </option>
                  ))}
                </select>
                <input
                  name="reason"
                  placeholder="填写调度原因"
                  className="rounded-[14px] border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
                <button type="submit" className="rounded-[14px] bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                  更新识别码归属
                </button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">当前没有可调度的组内识别码。</p>
      )}
    </section>
  );
}
