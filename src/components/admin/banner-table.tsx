import { EmptyState } from "@/components/empty-state";
import { toggleBannerQuoteStatusAction } from "@/app/(admin)/admin/banners/actions";

type BannerRow = {
  id: string;
  content: string;
  author: string | null;
  sourceType: "BUILTIN" | "CUSTOM";
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

export function BannerTable({ rows }: { rows: BannerRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无横幅文案"
        description="保存第一条横幅后，它会出现在登录后的全站顶部区域。"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/90 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">文案</th>
              <th className="px-5 py-4 font-medium">来源</th>
              <th className="px-5 py-4 font-medium">状态</th>
              <th className="px-5 py-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-700 transition hover:bg-cyan-50/50">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{row.content}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {row.author ? `署名：${row.author}` : "未填写署名"} · 创建于{" "}
                    {row.createdAt.toISOString().slice(0, 10)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {row.sourceType === "BUILTIN" ? "内置一言" : "自定义"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      row.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {row.status === "ACTIVE" ? "启用中" : "已停用"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <form action={toggleBannerQuoteStatusAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      {row.status === "ACTIVE" ? "停用" : "启用"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
