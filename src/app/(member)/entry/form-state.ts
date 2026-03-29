import type { SalesReviewStatus } from "@prisma/client";
import type { EntryDailyRhythmSummaryData } from "@/components/entry-daily-rhythm-summary";
import type { EntryDailyTargetFeedback } from "@/components/entry-daily-target-card";
import type { EntryReminderListItem } from "@/components/entry-reminder-list";
import type { EntrySelfTrendSummaryData } from "@/components/entry-self-trend-summary";
import type { SalesEntryDefaults } from "@/server/services/sales-service";
import type { MemberIdentifierWorkspace } from "@/server/services/member-identifier-sale-service";

export type SalesEntrySummary = {
  saleDate: string;
  count40: number;
  count60: number;
  total: number;
  remark: string;
  reviewStatus: SalesReviewStatus;
  lastSubmittedAtIso: string;
  savedAtIso: string;
  isUpdate: boolean;
  recoveredFromError: boolean;
  targetFeedback: EntryDailyTargetFeedback;
  selfTrend: EntrySelfTrendSummaryData;
  recentReminders: EntryReminderListItem[];
  dailyRhythm: EntryDailyRhythmSummaryData;
};

export type SalesEntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: SalesEntryDefaults;
  summary?: SalesEntrySummary | null;
};

export type IdentifierSaleFormValues = {
  codeId: string;
  planType: "PLAN_40" | "PLAN_60";
  saleDate: string;
  sourceMode: "ASSIGNED_LEAD" | "MANUAL_INPUT";
  prospectLeadId: string;
  qqNumber: string;
  major: string;
  remark: string;
  followUpItemId: string;
};

export type IdentifierSaleSummary = {
  saleId: string;
  planType: "PLAN_40" | "PLAN_60";
  sourceLabel: string;
  savedAtIso: string;
};

export type IdentifierSaleFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: IdentifierSaleFormValues;
  summary?: IdentifierSaleSummary | null;
  workspace?: MemberIdentifierWorkspace | null;
};
