import type { AdminInsightMemberCard as AdminInsightMemberCardData } from "@/server/services/admin-insights-service";

function getRiskTone(riskLevel: AdminInsightMemberCardData["riskLevel"]) {
  switch (riskLevel) {
    case "HIGH":
      return "bg-rose-100 text-rose-900";
    case "MEDIUM":
      return "bg-amber-100 text-amber-900";
    case "LOW":
      return "bg-emerald-100 text-emerald-900";
  }
}

export function AdminInsightMemberCard({ card }: { card: AdminInsightMemberCardData }) {
  return (
    <article className="space-y-4 rounded-[28px] border border-white/70 bg-white/84 p-5 shadow-[0_20px_52px_rgba(8,47,73,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{card.userName}</h2>
          <p className="text-sm text-slate-500">目标差值 {card.targetGap}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskTone(card.riskLevel)}`}>
          {card.riskLevel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {card.reasonTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          调整今日目标
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-[18px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900"
        >
          发送提醒
        </button>
      </div>
    </article>
  );
}
