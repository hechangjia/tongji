import type { SalesEntryDefaults } from "@/server/services/sales-service";

export type SalesEntrySummary = {
  saleDate: string;
  count40: number;
  count60: number;
  total: number;
  remark: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  lastSubmittedAtIso: string;
  savedAtIso: string;
  isUpdate: boolean;
  recoveredFromError: boolean;
};

export type SalesEntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: SalesEntryDefaults;
  summary?: SalesEntrySummary | null;
};
