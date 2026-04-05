"use client";

import { useFormStatus } from "react-dom";
import { importHitokotoBannerAction } from "@/app/(admin)/admin/banners/actions";

function ImportButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-100"
      disabled={pending}
    >
      {pending ? "导入中..." : "从 hitokoto 导入一条"}
    </button>
  );
}

export function BannerImportCard() {
  return (
    <form
      action={importHitokotoBannerAction}
      className="space-y-4 rounded-[24px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Hitokoto
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">导入网页名句</h2>
        <p className="text-sm leading-7 text-slate-600">
          从 hitokoto 官方接口抓取一条较短的句子，保存到你的本地横幅池里。
          导入后默认是“停用”状态，确认合适后再手动启用。
        </p>
      </div>

      <ImportButton />
    </form>
  );
}
