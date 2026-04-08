import type { AdminInsightMemberCard as AdminInsightMemberCardData } from "@/server/services/admin-insights-service";
import { AdminReminderForm } from "@/components/admin/admin-reminder-form";
import { AdminTargetAdjustForm } from "@/components/admin/admin-target-adjust-form";

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
    <article className="space-y-4 rounded-[24px] border border-white/70 bg-white/84 p-5 shadow-[0_20px_52px_rgba(8,47,73,0.08)]">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminTargetAdjustForm
          targetId={card.targetId}
          userId={card.userId}
          targetDate={card.targetDate}
          finalTotal={card.targetTotal}
          returnTo="/admin/insights"
        />
        <AdminReminderForm
          userId={card.userId}
          userName={card.userName}
          targetTotal={card.targetTotal}
          currentTotal={card.currentTotal}
          targetGap={card.targetGap}
          returnTo="/admin/insights"
        />
      </div>
    </article>
  );
}
