export const MAIKA_THEME_STORAGE_KEY = "maika-theme";
export const DEFAULT_MAIKA_THEME = "lagoon";

export const maikaThemes = [
  {
    id: "lagoon",
    label: "海雾青",
    description: "清透青蓝，偏原始默认风格",
    swatch: "linear-gradient(135deg,#082f49 0%,#0f766e 54%,#67e8f9 100%)",
  },
  {
    id: "sunset",
    label: "落日绯",
    description: "暖橙红调，适合更醒目的操作台",
    swatch: "linear-gradient(135deg,#7c2d12 0%,#ea580c 55%,#fb7185 100%)",
  },
  {
    id: "aurora",
    label: "极光绿",
    description: "深绿偏青，氛围更冷静",
    swatch: "linear-gradient(135deg,#022c22 0%,#166534 55%,#4ade80 100%)",
  },
  {
    id: "violet",
    label: "夜幕紫",
    description: "深夜蓝紫，层次更强",
    swatch: "linear-gradient(135deg,#312e81 0%,#7c3aed 55%,#c084fc 100%)",
  },
  {
    id: "ember",
    label: "余烬铜",
    description: "棕金暖色，更偏纸质和复古",
    swatch: "linear-gradient(135deg,#451a03 0%,#b45309 55%,#fbbf24 100%)",
  },
  {
    id: "graphite",
    label: "石墨灰",
    description: "低饱和冷灰，适合长时间录入",
    swatch: "linear-gradient(135deg,#111827 0%,#334155 55%,#94a3b8 100%)",
  },
] as const;

export type MaikaThemeName = (typeof maikaThemes)[number]["id"];

const maikaThemeSet = new Set<MaikaThemeName>(maikaThemes.map((theme) => theme.id));

export function resolveMaikaTheme(value?: string | null): MaikaThemeName {
  if (value && maikaThemeSet.has(value as MaikaThemeName)) {
    return value as MaikaThemeName;
  }

  return DEFAULT_MAIKA_THEME;
}

export function applyMaikaTheme(
  themeName: string,
  root: HTMLElement = document.documentElement,
  storage: Pick<Storage, "setItem"> | undefined = window.localStorage,
) {
  const resolvedTheme = resolveMaikaTheme(themeName);
  root.dataset.maikaTheme = resolvedTheme;
  storage?.setItem(MAIKA_THEME_STORAGE_KEY, resolvedTheme);
  return resolvedTheme;
}

export function buildMaikaThemeBootstrapScript() {
  const supported = maikaThemes.map((theme) => theme.id);

  return `
    (function () {
      var fallback = ${JSON.stringify(DEFAULT_MAIKA_THEME)};
      var supported = ${JSON.stringify(supported)};
      var theme = fallback;
      try {
        var stored = window.localStorage.getItem(${JSON.stringify(
          MAIKA_THEME_STORAGE_KEY,
        )});
        if (stored && supported.indexOf(stored) !== -1) {
          theme = stored;
        }
      } catch (error) {}
      document.documentElement.dataset.maikaTheme = theme;
    })();
  `;
}
