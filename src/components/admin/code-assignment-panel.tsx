import {
  assignIdentifierCodesAction,
  assignProspectLeadsAction,
} from "@/app/(admin)/admin/codes/actions";
import type {
  AdminCodeInventoryRow,
  AdminProspectLeadRow,
  CodeAssigneeOption,
} from "@/server/services/admin-code-service";

function formatAssigneeLabel(option: CodeAssigneeOption) {
  const roleLabel = option.role === "LEADER" ? "组长" : "成员";
  const groupLabel = option.groupName ? ` · ${option.groupName}` : "";

  return `${option.name}（${option.username}） · ${roleLabel}${groupLabel}`;
}

export function CodeAssignmentPanel({
  assigneeOptions,
  codeRows,
  prospectRows,
}: {
  assigneeOptions: CodeAssigneeOption[];
  codeRows: AdminCodeInventoryRow[];
  prospectRows: AdminProspectLeadRow[];
}) {
  const unassignedCodes = codeRows.filter((row) => row.status === "UNASSIGNED");
  const unassignedProspects = prospectRows.filter((row) => row.status === "UNASSIGNED");
  const canAssignCodes = assigneeOptions.length > 0 && unassignedCodes.length > 0;
  const canAssignProspects = assigneeOptions.length > 0 && unassignedProspects.length > 0;

  return (
    <section className="space-y-5 rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_22px_60px_rgba(8,47,73,0.08)]">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Dispatch
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">批量分发</h2>
        <p className="text-sm leading-7 text-slate-600">
          这轮先支持管理员直接分配给成员。新生 QQ 同时记录当前所属小组，为后续“按组分配”保留扩展位。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form action={assignIdentifierCodesAction} className="space-y-4 rounded-[24px] border border-slate-200 bg-white/80 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">分发识别码</h3>
            <p className="text-sm leading-6 text-slate-500">
              只会列出当前未分发的识别码。
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="code-userId" className="text-sm font-medium text-slate-700">
              目标成员
            </label>
            <select
              id="code-userId"
              name="userId"
              className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              defaultValue=""
            >
              <option value="" disabled>
                请选择成员
              </option>
              {assigneeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatAssigneeLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="codeIds" className="text-sm font-medium text-slate-700">
              待分发识别码
            </label>
            <select
              id="codeIds"
              name="codeIds"
              multiple
              size={Math.min(Math.max(unassignedCodes.length, 3), 8)}
              className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
            >
              {unassignedCodes.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.code}
                </option>
              ))}
            </select>
            {unassignedCodes.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待分发识别码。</p>
            ) : (
              <p className="text-xs text-slate-500">按住 Ctrl / Command 可多选。</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canAssignCodes}
            className="inline-flex h-11 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white transition duration-200 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            确认分发识别码
          </button>
        </form>

        <form action={assignProspectLeadsAction} className="space-y-4 rounded-[24px] border border-slate-200 bg-white/80 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">分配新生线索</h3>
            <p className="text-sm leading-6 text-slate-500">
              先按成员分配，系统会同步记录该成员当前所属小组。
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="lead-userId" className="text-sm font-medium text-slate-700">
              目标成员
            </label>
            <select
              id="lead-userId"
              name="userId"
              className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
              defaultValue=""
            >
              <option value="" disabled>
                请选择成员
              </option>
              {assigneeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatAssigneeLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="leadIds" className="text-sm font-medium text-slate-700">
              待分配新生线索
            </label>
            <select
              id="leadIds"
              name="leadIds"
              multiple
              size={Math.min(Math.max(unassignedProspects.length, 3), 8)}
              className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
            >
              {unassignedProspects.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.qqNumber} · {row.major}
                </option>
              ))}
            </select>
            {unassignedProspects.length === 0 ? (
              <p className="text-sm text-slate-500">当前没有待分配新生线索。</p>
            ) : (
              <p className="text-xs text-slate-500">按住 Ctrl / Command 可多选。</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canAssignProspects}
            className="inline-flex h-11 items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            确认分配线索
          </button>
        </form>
      </div>
    </section>
  );
}
