import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_MAIKA_THEME,
  MAIKA_THEME_STORAGE_KEY,
  resolveMaikaTheme,
} from "@/lib/theme";
import { ThemePalette } from "@/components/theme-palette";

describe("theme palette", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-maika-theme");
  });

  test("falls back to default theme for invalid stored values", () => {
    expect(resolveMaikaTheme("unknown-theme")).toBe(DEFAULT_MAIKA_THEME);
  });

  test("persists the selected theme to document and localStorage", () => {
    render(<ThemePalette />);

    fireEvent.click(screen.getByRole("button", { name: "打开主题调色板" }));
    fireEvent.click(screen.getByRole("button", { name: "落日绯" }));

    expect(document.documentElement.dataset.maikaTheme).toBe("sunset");
    expect(window.localStorage.getItem(MAIKA_THEME_STORAGE_KEY)).toBe("sunset");
  });
});
