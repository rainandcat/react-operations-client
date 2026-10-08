import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Density = 'comfortable' | 'compact';

interface PreferencesState {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  reset: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'light',
      density: 'comfortable',
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      reset: () => set({ theme: 'light', density: 'comfortable' })
    }),
    {
      name: 'operations-client-display-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme, density }) => ({ theme, density })
    }
  )
);
