import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_THEME, type ThemeId } from './themes';

const applyTheme = (theme: ThemeId): void => {
  if (typeof document !== 'undefined') {
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
      name: 'pokedex-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);
