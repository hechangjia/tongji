"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SettlementConfirmModal } from "./settlement-confirm-modal";

export function SettlementFilterArea() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentStatus = searchParams.get("status") || "pending";
  const currentMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const updateParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 时间筛选 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">结算月份</label>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => updateParam("month", e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* 状态切换 */}
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => updateParam("status", "pending")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                currentStatus === "pending"
                  ? "bg-white text-cyan-600 shadow-sm dark:bg-slate-700 dark:text-cyan-400"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              待结算
            </button>
            <button
              onClick={() => updateParam("status", "settled")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                currentStatus === "settled"
                  ? "bg-white text-cyan-600 shadow-sm dark:bg-slate-700 dark:text-cyan-400"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              已结算
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="px-6 py-2 bg-slate-900 text-white rounded-[16px] text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            onClick={() => setIsModalOpen(true)}
          >
            一键结算
          </button>
        </div>
      </div>

      <SettlementConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stats={{ totalAmount: 1050, memberCount: 3, riskCount: 1 }} // TODO: Extract from page props via context or pass down properly in a real app, hardcoded mock for now
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          router.refresh();
        }}
      />
    </>
  );
}
