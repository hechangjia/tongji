"use client";

import * as React from "react";
import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { SlideOver } from "@/components/ui/slide-over";
import {
  createManualFollowUpAction,
  reassignFollowUpAction,
  updateFollowUpStatusAction,
} from "@/app/(leader)/leader/sales/actions";
import type {
  LeaderWorkbenchFollowUpRow,
  LeaderWorkbenchMemberRow,
} from "@/server/services/leader-workbench-service";

function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function FollowUpDetailPanel({ 
  item, 
  memberOptions 
}: { 
  item: LeaderWorkbenchFollowUpRow;
  memberOptions: LeaderWorkbenchMemberRow[];
}) {
  return (
    <div className="space-y-8">
      {/* 状态与来源 */}
      <div className="flex gap-2">
        <span className="px-2.5 py-1 bg-maika-accent-strong/10 text-maika-accent-strong rounded-full text-xs font-semibold mono-accent">
          {item.sourceType}
        </span>
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-semibold">
          {item.status}
        </span>
      </div>

      <div className="space-y-6">
        {/* 改派区块 */}
        <section className="space-y-3">
          <p className="eyebrow text-maika-ink">重新分配负责人</p>
          <form action={reassignFollowUpAction} className="grid gap-3">
            <input type="hidden" name="followUpItemId" value={item.id} readOnly />
            <select
              name="nextOwnerUserId"
              defaultValue={item.currentOwnerUserId ?? ""}
              className="rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong"
            >
              <option value="">退回组池</option>
              {memberOptions.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userName}
                </option>
              ))}
            </select>
            <input
              name="reason"
              placeholder="填写改派原因"
              required
              className="rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong"
            />
            <button type="submit" className="rounded-[18px] bg-maika-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md">
              确认改派
            </button>
          </form>
        </section>

        {/* 状态更新区块 */}
        <section className="space-y-3">
          <p className="eyebrow text-maika-ink">强制更新状态</p>
          <form action={updateFollowUpStatusAction} className="grid gap-3">
            <input type="hidden" name="followUpItemId" value={item.id} readOnly />
            <select
              name="status"
              defaultValue={item.status}
              className="rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong"
            >
              <option value="UNTOUCHED">UNTOUCHED</option>
              <option value="FOLLOWING_UP">FOLLOWING_UP</option>
              <option value="APPOINTED">APPOINTED</option>
              <option value="READY_TO_CONVERT">READY_TO_CONVERT</option>
              <option value="INVALID">INVALID</option>
            </select>
            <input
              name="reason"
              placeholder="填写推进原因"
              required
              className="rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong"
            />
            <button type="submit" className="rounded-[18px] bg-maika-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md">
              确认更新
            </button>
          </form>
        </section>

        <section className="pt-4 border-t border-maika-muted/20">
          <Link
            href={`/entry?followUpItemId=${item.id}`}
            className="block w-full text-center rounded-[18px] border border-maika-accent-strong px-4 py-3 font-medium text-maika-accent-strong transition hover:bg-maika-accent-strong/5"
          >
            去成员录单页处理
          </Link>
        </section>
      </div>
    </div>
  );
}

export function LeaderFollowUpSection({
  items,
  memberOptions,
}: {
  items: LeaderWorkbenchFollowUpRow[];
  memberOptions: LeaderWorkbenchMemberRow[];
}) {
  const [activeItem, setActiveItem] = React.useState<LeaderWorkbenchFollowUpRow | null>(null);

  return (
    <>
      <BentoCard radius="lg" className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="eyebrow mb-1 text-maika-accent-strong">Follow Up Queue</p>
            <h2 className="text-2xl font-semibold text-maika-ink">线索推进区</h2>
          </div>
        </div>

        <form action={createManualFollowUpAction} className="mb-8 grid gap-3 rounded-[24px] border border-dashed border-maika-accent/50 bg-maika-accent/5 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <input
            name="summaryNote"
            placeholder="新增自主获客跟进摘要"
            required
            className="rounded-[18px] border border-maika-muted/20 bg-white/60 dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong transition"
          />
          <select
            name="currentOwnerUserId"
            defaultValue=""
            className="rounded-[18px] border border-maika-muted/20 bg-white/60 dark:bg-black/20 px-4 py-3 text-sm outline-none focus:border-maika-accent-strong transition"
          >
            <option value="">放入组池 (待分配)</option>
            {memberOptions.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-[18px] bg-maika-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
          >
            建立线索
          </button>
        </form>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setActiveItem(item)}
                className="group rounded-[24px] border border-maika-muted/10 bg-white/40 dark:bg-black/20 p-4 cursor-pointer hover:bg-maika-foreground/5 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-maika-ink mb-1 group-hover:text-maika-accent-strong transition-colors">
                      {item.summaryNote || (item.prospectLead ? (
                        <span className="mono-accent tracking-wider">{item.prospectLead.qqNumber}</span>
                      ) : "待补充摘要")}
                      {item.prospectLead?.major && ` · ${item.prospectLead.major}`}
                    </p>
                    <p className="text-xs text-maika-muted">
                      负责人: {item.currentOwnerName ?? "组池待分配"} · <span className="mono-accent">{formatDateTime(item.lastActionAt)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-maika-accent-strong/10 text-maika-accent-strong rounded-full text-[10px] font-semibold mono-accent mb-1">
                      {item.status}
                    </span>
                    <p className="text-xs text-maika-muted">点击处理 &rarr;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-maika-muted text-center py-8">当前组池及分配状态下暂无待推进线索</p>
        )}
      </BentoCard>

      <SlideOver
        open={activeItem !== null}
        onOpenChange={(open) => !open && setActiveItem(null)}
        title="线索状态流转"
        description={
          activeItem ? `处理人：${activeItem.currentOwnerName ?? '暂无'} · 最后更新：${formatDateTime(activeItem.lastActionAt)}` : ""
        }
      >
        {activeItem && <FollowUpDetailPanel item={activeItem} memberOptions={memberOptions} />}
      </SlideOver>
    </>
  );
}
