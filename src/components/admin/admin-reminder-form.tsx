import { sendMemberReminderAction } from "@/app/(admin)/admin/insights/actions";
import { buildReminderFromTemplate } from "@/server/services/member-reminder-service";
import type { ReminderTemplate } from "@/lib/validators/reminder";

const defaultTemplate: ReminderTemplate = "TARGET_GAP";

export function AdminReminderForm({
  userId,
  userName,
  targetTotal,
  currentTotal,
  targetGap,
  returnTo,
}: {
  userId: string;
  userName: string;
  targetTotal: number;
  currentTotal: number;
  targetGap: number;
  returnTo: string;
}) {
  const defaultReminder = buildReminderFromTemplate(defaultTemplate, {
    memberName: userName,
    targetTotal,
    currentTotal,
    gap: targetGap,
  });

  return (
    <form action={sendMemberReminderAction} className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="space-y-1 text-sm text-slate-600">
        <span>提醒模板</span>
        <select
          name="template"
          defaultValue={defaultTemplate}
          className="rounded-[16px] border border-slate-200 px-3 py-2 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        >
          <option value="TARGET_GAP">目标落后提醒</option>
          <option value="MISSING_SUBMISSION">迟交 / 未交提醒</option>
          <option value="FOLLOW_UP">关注状态提醒</option>
          <option value="CUSTOM">管理员自定义</option>
        </select>
      </label>

      <label className="space-y-1 text-sm text-slate-600">
        <span>标题</span>
        <input
          name="title"
          type="text"
          defaultValue={defaultReminder.title}
          className="rounded-[16px] border border-slate-200 px-3 py-2 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        />
      </label>

      <label className="space-y-1 text-sm text-slate-600">
        <span>内容</span>
        <textarea
          name="content"
          defaultValue={defaultReminder.content}
          rows={3}
          className="rounded-[16px] border border-slate-200 px-3 py-2 outline-none transition duration-200 focus:border-cyan-400 focus:bg-cyan-50/40"
        />
      </label>

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-[18px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900"
      >
        发送提醒
      </button>
    </form>
  );
}
