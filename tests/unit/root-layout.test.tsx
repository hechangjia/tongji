import { describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/app-monitoring", () => ({
  AppMonitoring: () => <div data-testid="app-monitoring" />,
}));

import RootLayout from "@/app/layout";

describe("root layout monitoring", () => {
  test("renders the shared monitoring entrypoint", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>监控测试</main>
      </RootLayout>,
    );

    expect(html).toContain('data-testid="app-monitoring"');
    expect(html).toContain("监控测试");
  });
});
