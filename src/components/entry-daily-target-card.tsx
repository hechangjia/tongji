import { StatusCallout } from "@/components/status-callout";

export type EntryDailyTargetFeedback = {
  targetTotal: number;
  currentTotal: number;
  gap: number;
  completionRate: number;
  status: "AHEAD" | "ON_TRACK" | "BEHIND" | "NO_TARGET";
};

function getTone(status: EntryDailyTargetFeedback["status"]) {
  switch (status) {
    case "AHEAD":
    case "ON_TRACK":
      return "success";
    case "BEHIND":
      return "warning";
    case "NO_TARGET":
      return "info";
  }
}

export function EntryDailyTargetCard({ feedback }: { feedback: EntryDailyTargetFeedback }) {
  return (
    <StatusCallout tone={getTone(feedback.status)} title="今日目标">
      <div className="space-y-3">
        <p className="text-3xl font-semibold">{feedback.targetTotal}</p>
        <p className="text-sm text-slate-700">当前完成 {feedback.currentTotal}</p>
        <p className="text-sm text-slate-700">
          {feedback.gap > 0 ? `还差 ${feedback.gap} 单` : "今天目标已完成"}
        </p>
      </div>
    </StatusCallout>
  );
}
