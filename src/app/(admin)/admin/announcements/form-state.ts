export type AnnouncementFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: {
    title: string;
    content: string;
    publishAt: string;
    expireAt: string;
    status: "ACTIVE" | "INACTIVE";
    isPinned: boolean;
  };
};
