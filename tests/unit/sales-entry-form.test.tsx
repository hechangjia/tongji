import { describe, expect, test } from "vitest";

describe("sales entry form", () => {
  test("avoids framer-motion wrappers in the high-frequency entry form", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/sales-entry-form.tsx`, "utf8"),
    );

    expect(source).not.toContain("framer-motion");
    expect(source).not.toContain("motion.");
    expect(source).not.toContain("AnimatePresence");
  });
});
