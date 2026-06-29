export type ThemeId = 'crimson' | 'sv' | 'light' | 'midnight';

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  swatch: string;
  isLight: boolean;
};

export const THEMES: ThemeMeta[] = [
  { id: 'crimson', label: 'Pokédex Crimson', swatch: '#ee2b1c', isLight: false },
  { id: 'sv', label: 'Scarlet · Violet', swatch: '#f1361d', isLight: false },
  { id: 'light', label: 'Pokédex Light', swatch: '#e3350d', isLight: true },
  { id: 'midnight', label: '미드나이트', swatch: '#10b981', isLight: false },
];

export const DEFAULT_THEME: ThemeId = 'crimson';

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEMES.some((theme) => theme.id === value);

export const isLightTheme = (id: ThemeId): boolean => THEMES.find((theme) => theme.id === id)?.isLight ?? false;
