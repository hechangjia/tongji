import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 圆角规模，严格对应 globals.css 中的 3 阶圆角
   * sm = 18px (适合小卡片、输入框)
   * md = 24px (适合主要指标卡)
   * lg = 30px (适合大容器外壳)
   */
  radius?: "sm" | "md" | "lg";
  /** 是否开启内部的毛玻璃效果 (maika-glass)，默认为 true */
  glass?: boolean;
  /** 是否开启悬停微拟物发光交互 */
  interactive?: boolean;
}

export function BentoCard({
  className,
  radius = "md",
  glass = true,
  interactive = false,
  children,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-maika-muted/10",
        glass ? "maika-glass" : "bg-white/60 dark:bg-black/30",
        radius === "sm" && "rounded-[var(--radius-sm)]",
        radius === "md" && "rounded-[var(--radius-md)]",
        radius === "lg" && "rounded-[var(--radius-lg)]",
        interactive &&
          "transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_15px_var(--maika-ring)] hover:border-maika-accent",
        !interactive && "shadow-[0_16px_36px_rgba(8,47,73,0.08)] dark:shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
