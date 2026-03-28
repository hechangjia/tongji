export type BannerQuoteFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    content: string;
    author: string;
    status: "ACTIVE" | "INACTIVE";
  };
};

export type BannerSettingsFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    displayMode: "RANDOM" | "ROTATE";
    isEnabled: boolean;
  };
};
