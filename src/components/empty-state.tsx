import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-cyan-300/70 bg-white/72 px-6 py-8 text-center shadow-[0_16px_36px_rgba(8,47,73,0.08)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
        Empty State
      </p>
      <h2 className="mt-3 font-display text-2xl text-slate-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
