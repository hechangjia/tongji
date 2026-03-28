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
import {
  getCachedBannerShellData,
  getCachedVisibleAnnouncements,
} from "@/server/services/shell-content-cache";

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
  { label: "小组榜单", href: "/leaderboard/groups" },
] as const;

const adminNavItems = [
  { label: "管理员功能", href: "/admin" },
  { label: "成员管理", href: "/admin/members" },
  { label: "识别码与线索", href: "/admin/codes" },
  { label: "销售记录", href: "/admin/sales" },
  { label: "卡酬规则", href: "/admin/commission-rules" },
  { label: "结算", href: "/admin/settlements" },
  { label: "横幅一言", href: "/admin/banners" },
  { label: "全体公告", href: "/admin/announcements" },
] as const;

const leaderNavItems = [
  { label: "小组看板", href: "/leader/group" },
  { label: "小组销售", href: "/leader/sales" },
  { label: "小组榜单", href: "/leaderboard/groups" },
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

  if (role === "LEADER") {
    return [
      {
        title: "组长区",
        items: [...leaderNavItems],
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
  const bannerPromise =
    banner === undefined ? getCachedBannerShellData() : Promise.resolve(banner);
  const announcementsPromise =
    announcements === undefined
      ? getCachedVisibleAnnouncements()
      : Promise.resolve(announcements);
  const [resolvedBanner, resolvedAnnouncements] = await Promise.all([
    bannerPromise,
    announcementsPromise,
  ]);

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
