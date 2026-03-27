import { adjustDailyTargetAction } from "@/app/(admin)/admin/insights/actions";

export function AdminTargetAdjustForm({
  targetId,
  finalTotal,
  returnTo,
}: {
  targetId: string | null;
  finalTotal: number;
  returnTo: string;
}) {
  if (!targetId) {
    return (
      <div className="rounded-[18px] border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        今日目标尚未生成
      </div>
    );
  }

  return (
    <form action={adjustDailyTargetAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="space-y-1 text-sm text-slate-600">
        <span>今日目标</span>
        <input
          name="finalTotal"
          type="number"
          min="0"
          defaultValue={finalTotal}
          className="w-28 rounded-[16px] border border-slate-200 px-3 py-2 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-4 text-sm font-semibold text-white"
      >
        调整今日目标
      </button>
    </form>
  );
}
