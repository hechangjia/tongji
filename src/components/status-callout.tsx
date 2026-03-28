import type { ReactNode } from "react";

type StatusCalloutProps = {
  tone?: "success" | "warning" | "error" | "info";
  title?: string;
  children: ReactNode;
};

const toneClassNames: Record<NonNullable<StatusCalloutProps["tone"]>, string> = {
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/90 text-amber-900",
  error: "border-rose-200 bg-rose-50/90 text-rose-900",
  info: "border-cyan-200 bg-cyan-50/90 text-cyan-900",
};

export function StatusCallout({
  tone = "info",
  title,
  children,
}: StatusCalloutProps) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 shadow-sm ${toneClassNames[tone]}`}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      <div className={`${title ? "mt-2" : ""} text-sm leading-6`}>{children}</div>
    </div>
  );
}
