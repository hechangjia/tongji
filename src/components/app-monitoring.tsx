"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function AppMonitoring() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <ProgressBar
        height="3px"
        color="var(--maika-accent-strong, #0f766e)"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
