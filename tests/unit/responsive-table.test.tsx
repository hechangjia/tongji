import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ResponsiveTable } from "@/components/ui/responsive-table";

describe("responsive table", () => {
  test("stays server-safe and avoids client-only animation dependencies", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/ui/responsive-table.tsx`, "utf8"),
    );

    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("framer-motion");
  });

  test("renders desktop headers and row content without animation wrappers", () => {
    render(
      <ResponsiveTable
        data={[
          {
            id: "row-1",
            label: "北极星组",
            total: 12,
          },
        ]}
        columns={[
          { key: "label", label: "名称", mobilePriority: true },
          { key: "total", label: "总数" },
        ]}
        rowKey={(row) => row.id}
        title="完整排行明细"
      />,
    );

    expect(screen.getByText("完整排行明细")).toBeInTheDocument();
    expect(screen.getAllByText("名称").length).toBeGreaterThan(0);
    expect(screen.getAllByText("北极星组").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
  });
});
