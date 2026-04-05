"use client";

import { UserStatus } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { BentoCard } from "@/components/ui/bento-card";
import { SlideOver } from "@/components/ui/slide-over";
import { useState } from "react";
import {
  deleteMemberAction,
  resetMemberPasswordAction,
  updateMemberAction,
} from "@/app/(admin)/admin/members/actions";

type MemberGroupOption = {
  id: string;
  name: string;
};

type MemberRole = "ADMIN" | "LEADER" | "MEMBER";

export type MemberRow = {
  id: string;
  username: string;
  name: string;
  role: MemberRole;
  groupId: string | null;
  remark: string | null;
  group: {
    name: string;
  } | null;
  status: UserStatus;
  createdAt: Date;
};

function roleLabel(role: MemberRole) {
  switch (role) {
    case "ADMIN":
      return "管理员";
    case "LEADER":
      return "组长";
    default:
      return "成员";
  }
}

function roleBadgeClassName(role: MemberRole) {
  switch (role) {
    case "ADMIN":
      return "bg-rose-500/10 text-rose-700";
    case "LEADER":
      return "bg-amber-500/10 text-amber-700";
    default:
      return "bg-maika-muted/10 text-maika-muted";
  }
}

function MemberEditDrawer({
  member,
  groups,
  currentAdminId,
  onClose,
}: {
  member: MemberRow;
  groups: MemberGroupOption[];
  currentAdminId: string;
  onClose: () => void;
}) {
  const isCurrentAdmin = member.id === currentAdminId;
  const disableCurrentAdminRole = isCurrentAdmin && member.role === "ADMIN";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <span className="mono-accent font-semibold px-2 py-1 bg-maika-muted/10 rounded text-xs text-maika-ink">
          ID: {member.id.slice(-6)}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClassName(member.role)}`}>
          {roleLabel(member.role)}
        </span>
      </div>

      <form action={updateMemberAction} className="space-y-6" onSubmit={() => setTimeout(onClose, 100)}>
        <input type="hidden" name="id" value={member.id} />
        {isCurrentAdmin && <input type="hidden" name="status" value={member.status} />}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="eyebrow text-maika-ink">基本信息</label>
            <div className="grid gap-3">
              <input
                name="username"
                type="text"
                defaultValue={member.username}
                placeholder="登录账号"
                required
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong"
              />
              <input
                name="name"
                type="text"
                defaultValue={member.name}
                placeholder="系统内姓名"
                required
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="eyebrow text-maika-ink">归属与角色</label>
            <div className="grid gap-3">
              <select
                name="role"
                defaultValue={member.role}
                disabled={disableCurrentAdminRole}
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong disabled:opacity-50"
              >
                <option value="MEMBER">成员 (仅录单与看个人)</option>
                <option value="LEADER">组长 (工作台权限)</option>
                <option value="ADMIN">超级管理员 (最高权限)</option>
              </select>
              <select
                name="groupId"
                defaultValue={member.groupId || ""}
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong"
              >
                <option value="">(无所属小组)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    归属: {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="eyebrow text-maika-ink">附加与状态</label>
            <div className="grid gap-3">
              <input
                name="remark"
                type="text"
                defaultValue={member.remark ?? ""}
                placeholder="备注 (可选)"
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong"
              />
              <select
                name="status"
                defaultValue={member.status}
                disabled={isCurrentAdmin}
                className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-maika-accent-strong disabled:opacity-50"
              >
                <option value="ACTIVE">状态: 活跃可用</option>
                <option value="DISABLED">状态: 停用不可登</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-[18px] bg-maika-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-md"
        >
          保存所有修改
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-maika-muted/10">
        <form action={resetMemberPasswordAction} onSubmit={() => setTimeout(onClose, 100)}>
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            className="w-full rounded-[18px] border border-maika-muted/20 bg-white dark:bg-black/20 px-4 py-3 text-sm font-medium text-maika-ink transition hover:bg-maika-foreground/5"
            onClick={(e) => {
              if (!confirm(`确认将密码重置为系统默认？`)) e.preventDefault();
            }}
          >
            重置密码
          </button>
        </form>

        <form action={deleteMemberAction} onSubmit={() => setTimeout(onClose, 100)}>
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            disabled={isCurrentAdmin}
            className="w-full rounded-[18px] bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-50"
            onClick={(e) => {
              if (!confirm(`即将永久删除 ${member.username}。确认操作？`)) e.preventDefault();
            }}
          >
            删除用户
          </button>
        </form>
      </div>
    </div>
  );
}

export function MemberTable({
  rows,
  groups,
  currentAdminId,
}: {
  rows: MemberRow[];
  groups: MemberGroupOption[];
  currentAdminId: string;
}) {
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无成员数据"
        description="创建第一位成员后，后续状态调整和密码重置都会显示在这里。"
      />
    );
  }

  return (
    <>
      <BentoCard radius="lg" className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">
              <th className="px-6 py-4 font-semibold">账号 / 姓名</th>
              <th className="px-6 py-4 font-semibold">角色与组别</th>
              <th className="px-6 py-4 font-semibold">系统状态</th>
              <th className="px-6 py-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-maika-muted/5">
            {rows.map((row) => (
              <tr key={row.id} className="align-middle text-maika-foreground transition hover:bg-maika-foreground/5">
                <td className="px-6 py-4">
                  <div className="font-semibold text-maika-ink mono-accent">{row.username}</div>
                  <div className="text-xs text-maika-muted mt-1">{row.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${roleBadgeClassName(row.role)}`}>
                      {roleLabel(row.role)}
                    </span>
                    <span className="text-sm">
                      {row.group?.name || <span className="text-maika-muted italic">无小组</span>}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    row.status === "ACTIVE" 
                      ? "bg-green-500/10 text-green-700" 
                      : "bg-rose-500/10 text-rose-700"
                  }`}>
                    {row.status === "ACTIVE" ? "正常" : "已停用"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setEditingMember(row)}
                    className="inline-flex items-center justify-center rounded-[14px] bg-maika-ink/5 hover:bg-maika-ink/10 px-4 py-2 text-xs font-semibold text-maika-ink transition"
                  >
                    管理与编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </BentoCard>

      <SlideOver
        open={editingMember !== null}
        onOpenChange={(open) => !open && setEditingMember(null)}
        title={editingMember ? `编辑人员: ${editingMember.name}` : ""}
        description={editingMember ? `上次活跃或创建时间: ${editingMember.createdAt.toISOString().slice(0, 10)}` : ""}
      >
        {editingMember && (
          <MemberEditDrawer 
            member={editingMember} 
            groups={groups} 
            currentAdminId={currentAdminId}
            onClose={() => setEditingMember(null)}
          />
        )}
      </SlideOver>
    </>
  );
}
