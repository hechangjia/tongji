export type MemberCreateFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    username: string;
    name: string;
    password: string;
    status: "ACTIVE" | "INACTIVE";
  };
};
