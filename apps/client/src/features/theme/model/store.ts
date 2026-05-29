import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_THEME, type ThemeId } from "./themes";

// <html data-theme="..."> 를 설정하면 index.css의 토큰 오버라이드가 즉시 적용된다.
const applyTheme = (theme: ThemeId): void => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
};

type ThemeState = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "pokedex-theme",
      // 새로고침 복원 시에도 <html>에 반영(인라인 스크립트와 이중 안전).
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);
