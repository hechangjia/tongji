import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { AppMonitoring } from "@/components/app-monitoring";
import { ThemePalette } from "@/components/theme-palette";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

// 配置英文字体（DM Sans 主干）
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});



// 配置系统标识符破局字体
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

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
      className={`h-full antialiased ${dmSans.variable}  ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans bg-slate-100 text-slate-900">
        <ThemeScript />
        {children}
        <ThemePalette />
        <AppMonitoring />
      </body>
    </html>
  );
}
