import { describe, expect, test } from "vitest";

describe("root layout monitoring", () => {
  test("keeps theme bootstrap in the root layout but leaves the interactive palette out", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/app/layout.tsx`, "utf8"),
    );

    expect(source).toContain("<ThemeScript />");
    expect(source).not.toContain("<ThemePalette />");
  });
});
