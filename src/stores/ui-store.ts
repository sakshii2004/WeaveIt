import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  leftPanelOpen: boolean;
  inspectorOpen: boolean;
  commandPaletteOpen: boolean;
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (resolvedTheme: 'light' | 'dark') => void;
  toggleLeftPanel: () => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export function applyThemeToDOM(theme: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  let resolved: 'light' | 'dark' = 'light';
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem('weaveit-theme', theme);
  } catch {
    // ignore in environments without localStorage
  }

  return resolved;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  resolvedTheme: 'light',
  leftPanelOpen: false,
  inspectorOpen: false,
  commandPaletteOpen: false,
  setTheme: (theme) => {
    const resolvedTheme = applyThemeToDOM(theme);
    set({ theme, resolvedTheme });
  },
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
