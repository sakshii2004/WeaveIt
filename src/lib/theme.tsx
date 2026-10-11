'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUIStore, Theme } from '@/stores/ui-store';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useUIStore();

  useEffect(() => {
    // Initialize theme from localStorage once on initial mount
    try {
      const saved = localStorage.getItem('weaveit-theme') as Theme | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setTheme(saved);
      } else {
        setTheme('light');
      }
    } catch {
      setTheme('light');
    }

    // Listen to system dark mode changes when user preference is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = useUIStore.getState().theme;
      if (current === 'system') {
        useUIStore.getState().setTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [setTheme]);

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
