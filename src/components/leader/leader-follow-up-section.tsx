import Link from "next/link";
import {
  createManualFollowUpAction,
  reassignFollowUpAction,
  updateFollowUpStatusAction,
} from "@/app/(leader)/leader/sales/actions";
import type {
  LeaderWorkbenchFollowUpRow,
  LeaderWorkbenchMemberRow,
} from "@/server/services/leader-workbench-service";

function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LeaderFollowUpSection({
  items,
  memberOptions,
}: {
  items: LeaderWorkbenchFollowUpRow[];
  memberOptions: LeaderWorkbenchMemberRow[];
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Follow Up Queue
        </p>
        <h2 className="text-2xl font-semibold text-slate-950">线索推进区</h2>
        <p className="text-sm leading-7 text-slate-600">
          统一承接正式 QQ 线索和早期自主获客项，默认把最需要组长处理的事项放在前面。
        </p>
      </div>

      <form action={createManualFollowUpAction} className="mt-6 grid gap-3 rounded-[22px] border border-dashed border-cyan-200 bg-cyan-50/50 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <input
          name="summaryNote"
          placeholder="新增自主获客跟进摘要"
          className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
        />
        <select
          name="currentOwnerUserId"
          defaultValue=""
          className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400"
        >
          <option value="">先放组池</option>
          {memberOptions.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.userName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-[16px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          创建自主获客跟进
        </button>
      </form>

      {items.length > 0 ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {item.summaryNote || (item.prospectLead ? `${item.prospectLead.qqNumber} · ${item.prospectLead.major}` : "待补充摘要")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    当前负责人：{item.currentOwnerName ?? "组池待分配"} · 最近动作时间：{formatDateTime(item.lastActionAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-700">{item.sourceType}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{item.status}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/entry?followUpItemId=${item.id}`}
                  className="inline-flex items-center rounded-[14px] border border-cyan-200 px-3 py-2 font-medium text-cyan-800 transition hover:bg-cyan-50"
                >
                  去成员录单
                </Link>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <form action={reassignFollowUpAction} className="grid gap-3 rounded-[18px] border border-white bg-white p-3">
                  <input type="hidden" name="followUpItemId" value={item.id} readOnly />
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
                    placeholder="填写改派原因"
                    className="rounded-[14px] border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  />
                  <button type="submit" className="rounded-[14px] bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                    改派跟进项
                  </button>
                </form>

                <form action={updateFollowUpStatusAction} className="grid gap-3 rounded-[18px] border border-white bg-white p-3">
                  <input type="hidden" name="followUpItemId" value={item.id} readOnly />
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="rounded-[14px] border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  >
                    <option value="UNTOUCHED">UNTOUCHED</option>
                    <option value="FOLLOWING_UP">FOLLOWING_UP</option>
                    <option value="APPOINTED">APPOINTED</option>
                    <option value="READY_TO_CONVERT">READY_TO_CONVERT</option>
                    <option value="INVALID">INVALID</option>
                  </select>
                  <input
                    name="reason"
                    placeholder="填写推进原因"
                    className="rounded-[14px] border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  />
                  <button type="submit" className="rounded-[14px] bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                    更新状态
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">当前没有待推进的线索或自主获客项。</p>
      )}
    </section>
  );
}
