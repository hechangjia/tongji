"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 原生 React 侧滑抽屉实现 (无第三方依赖)
 * 用于替代传统模态框和跨页面跳转，保持上下文不断裂。
 * 性能约束：抽屉默认不挂载 DOM（条件渲染），确保首屏极速加载。
 */
export function SlideOver({
  open,
  onOpenChange,
  title,
  description,
  children,
}: SlideOverProps) {
  // 处理背景锁定
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Escape 关闭
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩层 - 点击边缘关闭 */}
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />

      {/* 侧边抽屉面板 */}
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className="pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-out sm:duration-400"
          style={{
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-900 shadow-2xl rounded-l-[var(--radius-lg)] border-l border-white/20 dark:border-white/10">
            {/* Header */}
            <div className="px-6 py-6 sm:px-8 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h2 className="text-xl font-semibold text-maika-ink">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-maika-muted">
                      {description}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex h-7 items-center">
                  <button
                    type="button"
                    className="relative rounded-md text-maika-muted hover:text-maika-ink focus:outline-none focus:ring-2 focus:ring-maika-accent"
                    onClick={() => onOpenChange(false)}
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">关闭面板</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 px-6 py-6 sm:px-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
