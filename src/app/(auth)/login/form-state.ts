export type LoginFormState = {
  error: string | null;
};

export type RegisterFormState = {
  status: "idle" | "error" | "manual_login";
  message: string | null;
};
