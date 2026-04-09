import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AppMonitoring } from "@/components/app-monitoring";

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

describe("app monitoring", () => {
  test("renders analytics and speed insights without a global progress bar", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/app-monitoring.tsx`, "utf8"),
    );

    expect(source).not.toContain("next-nprogress-bar");
    expect(source).not.toContain("AppProgressBar");

    render(<AppMonitoring />);

    expect(screen.getByTestId("analytics")).toBeInTheDocument();
    expect(screen.getByTestId("speed-insights")).toBeInTheDocument();
  });
});
