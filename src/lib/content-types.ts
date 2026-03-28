export type ShellBannerItem = {
  id: string;
  content: string;
  author: string | null;
};

export type ShellBannerData = {
  mode: "RANDOM" | "ROTATE";
  items: ShellBannerItem[];
} | null;

export type ShellAnnouncement = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  publishedLabel: string;
};
