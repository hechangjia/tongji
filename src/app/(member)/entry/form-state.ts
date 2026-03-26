import type { SalesEntryDefaults } from "@/server/services/sales-service";

export type SalesEntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: SalesEntryDefaults;
};
