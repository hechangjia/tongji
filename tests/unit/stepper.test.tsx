import { describe, expect, test } from "vitest";

describe("stepper", () => {
  test("uses plain input interactions without framer-motion", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/ui/stepper.tsx`, "utf8"),
    );

    expect(source).not.toContain("framer-motion");
    expect(source).not.toContain("motion.");
    expect(source).not.toContain("useAnimation");
  });
});
