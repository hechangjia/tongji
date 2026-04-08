"use client";

import { useState } from "react";
import type { SessionRole } from "@/lib/permissions";
import type { ShellNavSection } from "@/components/app-shell-client";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";

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

function MobileNavItem({
  href,
  label,
  currentPath,
  onNavigate,
}: {
  href: string;
  label: string;
  currentPath?: string;
  onNavigate: () => void;
}) {
  const active = isActivePath(currentPath, href);

  return (
    <IntentPrefetchLink
      href={href}
      enableIntentPrefetch={href.startsWith("/admin")}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`group flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-medium transition duration-200 ${
        active
          ? "border-maika-accent-strong/40 bg-maika-accent-strong text-white shadow-[0_16px_32px_rgba(15,118,110,0.22)]"
          : "border-white/10 bg-white/5 text-white/80 hover:border-maika-accent/30 hover:bg-white/10 hover:text-white"
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
    </IntentPrefetchLink>
  );
}

export function AppShellMobileMenu({
  role,
  userName,
  currentPath,
  navSections,
}: {
  role: SessionRole;
  userName?: string | null;
  currentPath?: string;
  navSections: ShellNavSection[];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rolePresentation = getRolePresentation(role);
  const displayName = userName ?? rolePresentation.fallbackName;

  return (
    <>
      <header className="maika-fade-up lg:hidden">
        <div className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_12px_32px_rgba(8,47,73,0.10)] backdrop-blur-md">
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-slate-200 bg-white/90 text-slate-900 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ≡
              </span>
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-slate-950 px-4 py-3 text-white">
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
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-5 text-white shadow-[0_20px_56px_rgba(8,47,73,0.24)] transition-transform duration-300">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/12 bg-white/8 text-white transition hover:border-cyan-300/40 hover:text-cyan-200"
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
                      <MobileNavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
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
    </>
  );
}
