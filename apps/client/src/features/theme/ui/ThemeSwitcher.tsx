import { Select } from '@/common/ui/Select';

import { useThemeStore } from '../model/store';
import { type ThemeId, THEMES } from '../model/themes';

const OPTIONS = THEMES.map((meta) => ({
  value: meta.id,
  label: (
    <span className="flex items-center gap-2">
      <span className="border-border size-3 shrink-0 rounded-full border" style={{ backgroundColor: meta.swatch }} />
      {meta.label}
    </span>
  ),
}));

export const ThemeSwitcher = () => {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <Select
      value={theme}
      onValueChange={(value) => setTheme(value as ThemeId)}
      options={OPTIONS}
      className="h-8 w-44"
    />
  );
};
