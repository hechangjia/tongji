import type { ReactNode } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { clsx } from "clsx";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  tone?: "light" | "dark" | "accent";
  hint?: string;
  delta?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
};

const toneClassNames: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  light: "text-maika-ink",
  dark: "bg-maika-ink text-white border-maika-ink/20",
  accent: "bg-gradient-to-br from-maika-accent/20 to-transparent border-maika-accent/30 text-maika-ink",
};

export function MetricCard({
  label,
  value,
  tone = "light",
  hint,
  delta,
}: MetricCardProps) {
  // 当使用了 tone="dark" 或 "accent" 时，我们关闭毛玻璃以强化对比
  const isSpecialTone = tone === "dark" || tone === "accent";
  
  return (
    <BentoCard 
      radius="md" 
      glass={!isSpecialTone} 
      className={clsx("p-5 flex flex-col justify-between h-full shadow-card", toneClassNames[tone])}
    >
      <p className={clsx("eyebrow mb-3", tone === "dark" ? "text-white/60" : "text-maika-muted")}>
        {label}
      </p>
      
      <div className="flex items-baseline gap-2">
        {/* MetricCard 的核心数值强制使用 Geist Mono 及 tabular-nums */}
        <div className="text-3xl font-semibold mono-accent leading-none">{value}</div>
        
        {delta && (
          <span className={clsx(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            delta.trend === "up" && "text-green-600 bg-green-500/10",
            delta.trend === "down" && "text-rose-600 bg-rose-500/10",
            delta.trend === "neutral" && "text-maika-muted bg-maika-muted/10"
          )}>
            {delta.trend === "up" ? "↑" : delta.trend === "down" ? "↓" : "−"} {delta.value}
          </span>
        )}
      </div>
      
      {hint ? (
        <p className={clsx("mt-3 text-xs leading-relaxed", tone === "dark" ? "text-white/70" : "text-maika-foreground/70")}>
          {hint}
        </p> 
      ) : null}
    </BentoCard>
  );
}
