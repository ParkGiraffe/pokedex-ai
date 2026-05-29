import { Select } from "@/common/ui/Select";

import { useThemeStore } from "../model/store";
import { THEMES, type ThemeId } from "../model/themes";

const OPTIONS = THEMES.map((meta) => ({
  value: meta.id,
  label: (
    <span className="flex items-center gap-2">
      <span
        className="size-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: meta.swatch }}
      />
      {meta.label}
    </span>
  ),
}));

// 헤더용 테마 드롭다운. 선택하면 글로벌 테마가 바뀐다(스토어가 <html data-theme>에 반영).
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
