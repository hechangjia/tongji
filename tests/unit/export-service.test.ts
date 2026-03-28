import { describe, expect, test } from "vitest";
import { buildWorkbookBuffer } from "@/server/services/export-service";

describe("excel export", () => {
  test("returns a non-empty xlsx buffer", async () => {
    const buffer = await buildWorkbookBuffer([{ name: "alice", total: 5 }], "总榜");

    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
