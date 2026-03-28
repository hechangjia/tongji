export type GroupCreateFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    name: string;
    slogan: string;
    remark: string;
    leaderUserId: string;
  };
};
