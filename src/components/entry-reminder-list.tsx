import { StatusCallout } from "@/components/status-callout";

export type EntryReminderListItem = {
  id: string;
  type: "TARGET_GAP" | "MISSING_SUBMISSION" | "FOLLOW_UP" | "CUSTOM";
  title: string;
  content: string;
  sentAtIso: string;
  senderName: string;
  status: "UNREAD" | "READ";
};

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EntryReminderList({ reminders }: { reminders: EntryReminderListItem[] }) {
  return (
    <StatusCallout tone="info" title="最近提醒">
      {reminders.length === 0 ? (
        <p className="text-sm text-slate-600">最近还没有新的提醒。</p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <article key={reminder.id} className="rounded-[18px] border border-slate-200 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">{reminder.title}</h3>
                  <p className="mt-1 text-sm text-slate-700">{reminder.content}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {reminder.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatSentAt(reminder.sentAtIso)} · {reminder.senderName}
              </p>
            </article>
          ))}
        </div>
      )}
    </StatusCallout>
  );
}
