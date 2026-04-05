"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import type { SessionRole } from "@/lib/permissions";
import type {
  ShellAnnouncement,
  ShellBannerData,
} from "@/lib/content-types";
import { AnnouncementList } from "@/components/announcement-list";
import { BannerRotator } from "@/components/banner-rotator";

export type ShellNavItem = {
  label: string;
  href: string;
};

export type ShellNavSection = {
  title: string;
  items: ShellNavItem[];
};

type AppShellClientProps = PropsWithChildren<{
  role: SessionRole;
  userName?: string | null;
  currentPath?: string;
  navSections: ShellNavSection[];
  banner: ShellBannerData;
  announcements: ShellAnnouncement[];
  topSlot?: ReactNode;
}>;

function getRolePresentation(role: SessionRole) {
  if (role === "ADMIN") {
    return {
      fallbackName: "管理员",
      description: "管理员权限已启用",
    };
  }

  if (role === "LEADER") {
    return {
      fallbackName: "组长",
      description: "组长带队模式",
    };
  }

  return {
    fallbackName: "成员",
    description: "成员录入模式",
  };
}

function isActivePath(currentPath: string | undefined, href: string) {
  return currentPath === href || currentPath?.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  currentPath,
  onNavigate,
}: ShellNavItem & {
  currentPath?: string;
  onNavigate?: () => void;
}) {
  const active = isActivePath(currentPath, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200 ${
        active
          ? "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-[0_16px_32px_rgba(6,182,212,0.22)]"
          : "border-white/10 bg-white/6 text-slate-100 hover:border-cyan-300/35 hover:bg-white/12 hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`text-xs transition ${
          active ? "text-slate-950" : "text-cyan-100/60 group-hover:text-cyan-100"
        }`}
      >
        →
      </span>
    </Link>
  );
}

export function AppShellClient({
  role,
  userName,
  currentPath: currentPathProp,
  navSections,
  banner,
  announcements,
  topSlot,
  children,
}: AppShellClientProps) {
  const pathname = usePathname();
  const currentPath = currentPathProp ?? pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rolePresentation = getRolePresentation(role);
  const displayName = userName ?? rolePresentation.fallbackName;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="maika-shell-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] gap-0 px-3 py-3 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="maika-fade-up hidden w-[288px] shrink-0 lg:flex">
          <div className="maika-sidebar-surface flex min-h-full w-full flex-col rounded-[30px] border border-white/10 p-6 text-white shadow-[0_28px_80px_rgba(8,47,73,0.28)]">
            <div className="relative overflow-hidden rounded-[26px] border border-white/8 bg-white/6 p-5">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl" />
              <p className="relative text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                Maika Ops
              </p>
              <h1 className="relative mt-3 font-display text-[1.7rem] leading-tight text-white">
                校园销售作战台
              </h1>
              <p className="relative mt-3 text-sm leading-6 text-slate-300">
                将每日录入、榜单追踪、规则配置和结算管理收束到一个更清晰的工作台。
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                当前身份
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{displayName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {rolePresentation.description}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-slate-950">
                  {role}
                </span>
              </div>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-5" aria-label="主导航">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <p className="pl-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {section.title}
                  </p>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <NavItem
                        key={item.href}
                        {...item}
                        currentPath={currentPath}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="maika-fade-up lg:hidden">
            <div className="rounded-[28px] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_20px_60px_rgba(8,47,73,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                    Maika
                  </p>
                  <h1 className="mt-1 font-display text-xl text-slate-950">
                    {navSections.find((section) =>
                      section.items.some((item) => isActivePath(currentPath, item.href)),
                    )?.items.find((item) => isActivePath(currentPath, item.href))?.label ??
                      "销售作战台"}
                  </h1>
                </div>
                <button
                  type="button"
                  aria-label="打开导航菜单"
                  onClick={() => setIsMenuOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-900 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  <span aria-hidden="true" className="text-xl leading-none">
                    ≡
                  </span>
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] bg-slate-950 px-4 py-3 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">身份</p>
                  <p className="mt-1 text-sm font-semibold">{displayName}</p>
                </div>
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-950">
                  {role}
                </span>
              </div>
            </div>
          </header>

          {isMenuOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="关闭导航菜单遮罩"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-5 text-white shadow-[0_30px_90px_rgba(8,47,73,0.35)] transition-transform duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">
                      Maika Ops
                    </p>
                    <p className="mt-2 font-display text-lg text-white">{displayName}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭导航菜单"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white transition hover:border-cyan-300/40 hover:text-cyan-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {navSections.map((section) => (
                    <div key={section.title} className="space-y-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {section.title}
                      </p>
                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <NavItem
                            key={item.href}
                            {...item}
                            currentPath={currentPath}
                            onNavigate={() => setIsMenuOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <main
            id="main-content"
            className="maika-fade-up relative mt-3 flex-1 lg:mt-0"
          >
            <div className="space-y-4 rounded-[30px] border border-white/60 bg-white/58 px-4 py-4 shadow-[0_28px_80px_rgba(8,47,73,0.12)] backdrop-blur-xl sm:px-6 sm:py-6 lg:min-h-[calc(100dvh-3rem)] lg:px-8 lg:py-8">
              <BannerRotator banner={banner} />
              <AnnouncementList announcements={announcements} />

              {topSlot}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
