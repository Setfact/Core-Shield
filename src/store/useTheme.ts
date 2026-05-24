import { create } from 'zustand';

const STORAGE_KEY = 'coreshield-theme';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

const storedPref = localStorage.getItem(STORAGE_KEY);
const initialDark = storedPref !== null ? storedPref === 'dark' : true;

if (initialDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useTheme = create<ThemeState>((set) => ({
  isDark: initialDark,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return { isDark: next };
    }),
}));
