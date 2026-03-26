import type { PropsWithChildren } from "react";
import type { SessionRole } from "@/lib/permissions";
import type {
  ShellAnnouncement,
  ShellBannerData,
} from "@/lib/content-types";
import {
  AppShellClient,
  type ShellNavSection,
} from "@/components/app-shell-client";
import { getVisibleAnnouncements } from "@/server/services/announcement-service";
import { getBannerShellData } from "@/server/services/banner-service";

type AppShellProps = PropsWithChildren<{
  role: SessionRole;
  userName?: string | null;
  currentPath?: string;
  banner?: ShellBannerData | null;
  announcements?: ShellAnnouncement[];
}>;

const memberNavItems = [
  { label: "今日录入", href: "/entry" },
  { label: "我的记录", href: "/records" },
  { label: "日榜", href: "/leaderboard/daily" },
  { label: "总榜", href: "/leaderboard/range" },
] as const;

const adminNavItems = [
  { label: "管理员功能", href: "/admin" },
  { label: "成员管理", href: "/admin/members" },
  { label: "销售记录", href: "/admin/sales" },
  { label: "卡酬规则", href: "/admin/commission-rules" },
  { label: "结算", href: "/admin/settlements" },
  { label: "横幅一言", href: "/admin/banners" },
  { label: "全体公告", href: "/admin/announcements" },
] as const;

export function buildNavSections(role: SessionRole): ShellNavSection[] {
  if (role === "ADMIN") {
    return [
      {
        title: "成员区",
        items: [...memberNavItems],
      },
      {
        title: "管理区",
        items: [...adminNavItems],
      },
    ];
  }

  return [
    {
      title: "成员区",
      items: [...memberNavItems],
    },
  ];
}

export async function AppShell({
  role,
  userName,
  currentPath,
  banner,
  announcements,
  children,
}: AppShellProps) {
  const resolvedBanner =
    banner === undefined ? await getBannerShellData() : banner;
  const resolvedAnnouncements =
    announcements === undefined ? await getVisibleAnnouncements() : announcements;

  return (
    <AppShellClient
      role={role}
      userName={userName}
      currentPath={currentPath}
      navSections={buildNavSections(role)}
      banner={resolvedBanner}
      announcements={resolvedAnnouncements}
    >
      {children}
    </AppShellClient>
  );
}
