'use client';

import { create } from "zustand";

interface ThemeStore {
  isDark: boolean;
  actions: ThemeStoreActions;
}

interface ThemeStoreActions {
  toggleDarkMode: () => void;
  initThemeStore: () => void;
}

const INITIAL_STATE: Omit<ThemeStore, 'actions'> = {
  isDark: false,
};

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  ...INITIAL_STATE,
  actions: {
    toggleDarkMode: () => {
      const isCurrentDark = get().isDark;
      if (isCurrentDark) {
        document.querySelector('html')?.classList.remove('dark');
      } else {
        document.querySelector('html')?.classList.add('dark');
      }
      set({ isDark: !isCurrentDark });
    },

    initThemeStore: () => {
      set({ isDark: window.matchMedia('prefers-color-scheme: dark').matches });
    },
  }
}));


