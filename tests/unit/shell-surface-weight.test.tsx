import { describe, expect, test } from "vitest";

describe("shell surface weight", () => {
  test("keeps the shared shell away from extra-heavy blur and shadow values", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/app-shell-client.tsx`, "utf8"),
    );

    expect(source).not.toContain("backdrop-blur-xl");
    expect(source).not.toContain("shadow-[0_28px_80px_rgba(8,47,73,0.12)]");
    expect(source).not.toContain("shadow-[0_20px_60px_rgba(8,47,73,0.12)]");
  });
});
