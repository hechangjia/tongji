import type { Metadata } from "next";
import { AppMonitoring } from "@/components/app-monitoring";
import { ThemePalette } from "@/components/theme-palette";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "校园电话卡销售统计系统",
  description: "校园电话卡销售统计与卡酬结算系统 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-slate-100 text-slate-900">
        <ThemeScript />
        {children}
        <ThemePalette />
        <AppMonitoring />
      </body>
    </html>
  );
}
