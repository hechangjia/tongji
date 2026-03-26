import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  tone?: "light" | "dark" | "accent";
  hint?: string;
};

const toneClassNames: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  light:
    "border-white/70 bg-white/82 text-slate-950 shadow-[0_16px_36px_rgba(8,47,73,0.08)]",
  dark:
    "border-slate-950/10 bg-slate-950 text-white shadow-[0_18px_42px_rgba(8,47,73,0.2)]",
  accent:
    "border-cyan-300/40 bg-cyan-100/80 text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.14)]",
};

export function MetricCard({
  label,
  value,
  tone = "light",
  hint,
}: MetricCardProps) {
  return (
    <div className={`rounded-[24px] border px-5 py-4 ${toneClassNames[tone]}`}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] opacity-75">
        {label}
      </p>
      <div className="mt-3 text-2xl font-semibold sm:text-[1.9rem]">{value}</div>
      {hint ? <p className="mt-2 text-sm opacity-75">{hint}</p> : null}
    </div>
  );
}
