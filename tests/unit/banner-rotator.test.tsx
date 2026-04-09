import { describe, expect, test } from "vitest";

describe("banner rotator", () => {
  test("renders banner content without a client-side interval rotator", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(`${process.cwd()}/src/components/banner-rotator.tsx`, "utf8"),
    );

    expect(source).not.toContain("setInterval");
    expect(source).not.toContain("useEffect");
  });
});
