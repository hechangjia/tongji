import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <section className="maika-page-header-surface overflow-hidden rounded-[24px] border border-white/60 px-5 py-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)] backdrop-blur-xl sm:px-6 lg:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-3xl leading-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
