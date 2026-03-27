import { StatusCallout } from "@/components/status-callout";

export type EntrySelfTrendSummaryData = {
  direction: "UP" | "FLAT" | "DOWN";
  label: string;
  message: string;
};

function getTone(direction: EntrySelfTrendSummaryData["direction"]) {
  switch (direction) {
    case "UP":
      return "success";
    case "FLAT":
      return "info";
    case "DOWN":
      return "warning";
  }
}

export function EntrySelfTrendSummary({ summary }: { summary: EntrySelfTrendSummaryData }) {
  return (
    <StatusCallout tone={getTone(summary.direction)} title="自我趋势">
      <div className="space-y-2">
        <p className="font-medium">{summary.label}</p>
        <p className="text-sm text-slate-700">{summary.message}</p>
      </div>
    </StatusCallout>
  );
}
