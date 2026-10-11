'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';

export function AuthThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="text-ink-soft hover:text-ink"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-sun" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4 text-ink-soft" strokeWidth={1.75} />
      )}
    </Button>
  );
}
