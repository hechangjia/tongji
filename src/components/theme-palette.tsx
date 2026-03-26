"use client";

import { useState } from "react";
import {
  applyMaikaTheme,
  DEFAULT_MAIKA_THEME,
  maikaThemes,
  resolveMaikaTheme,
  type MaikaThemeName,
} from "@/lib/theme";

export function ThemePalette() {
  const [activeTheme, setActiveTheme] = useState<MaikaThemeName>(() => {
    if (typeof document !== "undefined") {
      return resolveMaikaTheme(document.documentElement.dataset.maikaTheme);
    }

    return DEFAULT_MAIKA_THEME;
  });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed right-[calc(env(safe-area-inset-right)+1rem)] top-[calc(env(safe-area-inset-top)+1rem)] z-50 sm:right-[calc(env(safe-area-inset-right)+1.5rem)] sm:top-auto sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="w-[min(88vw,340px)] rounded-[26px] border border-white/65 bg-white/86 p-4 shadow-[0_24px_60px_rgba(8,47,73,0.18)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                  Theme Palette
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  页面主题
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  选择一个更适合你的工作台色调，当前浏览器会记住这个设置。
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭主题调色板"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {maikaThemes.map((theme) => {
                const active = theme.id === activeTheme;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    aria-label={theme.label}
                    onClick={() => {
                      const nextTheme = applyMaikaTheme(theme.id);
                      setActiveTheme(nextTheme);
                      setIsOpen(false);
                    }}
                    className={`rounded-[22px] border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-300 bg-cyan-50 shadow-[0_16px_40px_rgba(14,165,233,0.16)]"
                        : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/60"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="block h-12 rounded-[16px]"
                      style={{ backgroundImage: theme.swatch }}
                    />
                    <span className="mt-3 block text-sm font-semibold text-slate-900">
                      {theme.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {theme.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          aria-label="打开主题调色板"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_20px_50px_rgba(8,47,73,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-700"
        >
          <span aria-hidden="true">🎨</span>
          <span>调色板</span>
        </button>
      </div>
    </div>
  );
}
