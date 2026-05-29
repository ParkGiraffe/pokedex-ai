export type ThemeId = "crimson" | "sv" | "light" | "midnight";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  // 스위처에 보이는 대표색(테마 primary).
  swatch: string;
  // 밝은 배경 테마인지. Toaster 등 외부 위젯 테마 동기화에 쓴다.
  isLight: boolean;
};

// 스위처에 보이는 순서. 기본은 포켓몬 색감(crimson), midnight는 기존 다크 보존용.
export const THEMES: ThemeMeta[] = [
  { id: "crimson", label: "Pokédex Crimson", swatch: "#ee2b1c", isLight: false },
  { id: "sv", label: "Scarlet · Violet", swatch: "#f1361d", isLight: false },
  { id: "light", label: "Pokédex Light", swatch: "#e3350d", isLight: true },
  { id: "midnight", label: "미드나이트", swatch: "#10b981", isLight: false },
];

export const DEFAULT_THEME: ThemeId = "crimson";

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && THEMES.some((theme) => theme.id === value);

export const isLightTheme = (id: ThemeId): boolean =>
  THEMES.find((theme) => theme.id === id)?.isLight ?? false;
