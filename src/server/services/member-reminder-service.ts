import { db } from "@/lib/db";
import type { ReminderTemplate } from "@/lib/validators/reminder";

export type ReminderTemplateContext = {
  memberName: string;
  targetTotal: number;
  currentTotal: number;
  gap: number;
  custom?: {
    title: string;
    content: string;
  };
};

export function buildReminderFromTemplate(
  template: ReminderTemplate,
  context: ReminderTemplateContext,
) {
  switch (template) {
    case "TARGET_GAP":
      return {
        title: "今日目标仍有差距",
        content: `${context.memberName}，你今天距离目标还差 ${context.gap} 单，当前 ${context.currentTotal}/${context.targetTotal}，请尽快跟进。`,
      };
    case "MISSING_SUBMISSION":
      return {
        title: "今日记录仍未提交",
        content: `${context.memberName}，今天的销售记录还没有提交，请尽快补交。`,
      };
    case "FOLLOW_UP":
      return {
        title: "请关注今天的执行状态",
        content: `${context.memberName}，请优先跟进今天的执行节奏，如有异常及时反馈。`,
      };
    case "CUSTOM":
      return (
        context.custom ?? {
          title: "管理员提醒",
          content: `${context.memberName}，请查看最新提醒内容。`,
        }
      );
  }
}

export async function createMemberReminder(input: {
  userId: string;
  type: ReminderTemplate;
  title: string;
  content: string;
  sentById: string;
}) {
  return db.memberReminder.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      sentById: input.sentById,
    },
  });
}

export async function listRecentMemberReminders(userId: string, limit = 5) {
  return db.memberReminder.findMany({
    where: { userId },
    orderBy: [{ sentAt: "desc" }],
    take: limit,
    include: {
      sentBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });
}
