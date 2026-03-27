import type { SalesReviewStatus } from "@prisma/client";
import type { EntryDailyRhythmSummaryData } from "@/components/entry-daily-rhythm-summary";
import type { SalesEntryDefaults } from "@/server/services/sales-service";

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
  dailyRhythm: EntryDailyRhythmSummaryData;
};

export type SalesEntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: SalesEntryDefaults;
  summary?: SalesEntrySummary | null;
};
