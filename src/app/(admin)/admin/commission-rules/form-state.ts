export type CommissionRuleFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    userId: string;
    price40: string;
    price60: string;
    effectiveStart: string;
    effectiveEnd: string;
  };
};
