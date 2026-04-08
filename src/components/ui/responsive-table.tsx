import type { ReactNode } from "react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  mobilePriority?: boolean; // If true, always show in mobile card header
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyText?: string;
  title?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  rowKey,
  emptyText = "暂无数据",
  title,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/40 p-10 text-center">
        <p className="text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-slate-950 px-1">{title}</h3>}

      <div className="hidden md:block overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/90 text-left text-slate-600">
              <tr>
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-5 py-4 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="text-slate-700 transition hover:bg-cyan-50/55"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-4">
                      {col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {data.map((row) => (
          <article
            key={rowKey(row)}
            className="rounded-[24px] border border-white/70 bg-white/84 p-5 shadow-[0_12px_32px_rgba(8,47,73,0.06)] backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              {columns
                .filter((c) => c.mobilePriority)
                .map((col) => (
                  <div key={String(col.key)}>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-slate-400">
                      {col.label}
                    </p>
                    <div className="mt-1 text-sm font-semibold text-slate-950">
                      {col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)}
                    </div>
                  </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {columns
                .filter((c) => !c.mobilePriority)
                .map((col) => (
                  <div key={String(col.key)}>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-slate-400">
                      {col.label}
                    </p>
                    <div className="mt-1 text-sm text-slate-700">
                      {col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)}
                    </div>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
