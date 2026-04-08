import type { PropsWithChildren, ReactNode } from "react";
import type { SessionRole } from "@/lib/permissions";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { AppShellMobileMenu } from "@/components/app-shell-mobile-menu";

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

export function AppShellClient({
  role,
  userName,
  currentPath,
  navSections,
  topSlot,
  children,
}: AppShellClientProps) {
  const rolePresentation = getRolePresentation(role);
  const displayName = userName ?? rolePresentation.fallbackName;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="maika-shell-backdrop pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] gap-0 px-3 py-3 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="maika-fade-up hidden w-[288px] shrink-0 lg:flex translate-z-0">
          <div className="maika-sidebar-surface flex min-h-full w-full flex-col rounded-[30px] border border-white/10 p-6 text-white shadow-[0_18px_48px_rgba(8,47,73,0.20)]">
            <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-white/6 p-5">
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
          <AppShellMobileMenu
            role={role}
            userName={userName}
            currentPath={currentPath}
            navSections={navSections}
          />

          <main
            id="main-content"
            className="maika-fade-up relative mt-3 flex-1 lg:mt-0"
          >
            <div className="space-y-4 rounded-[30px] border border-white/60 bg-white/58 px-4 py-4 shadow-[0_16px_40px_rgba(8,47,73,0.10)] backdrop-blur-md sm:px-6 sm:py-6 lg:min-h-[calc(100dvh-3rem)] lg:px-8 lg:py-8">
              {topSlot}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
