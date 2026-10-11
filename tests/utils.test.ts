import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

describe('Utility functions', () => {
  it('cn() correctly merges and dedupes classes', () => {
    expect(cn('bg-brand', 'text-white')).toBe('bg-brand text-white');
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('rounded-sm', false && 'hidden', undefined, null)).toBe('rounded-sm');
  });
});

describe('UI Store', () => {
  it('initializes with default light theme and toggles resolved theme', () => {
    const store = useUIStore.getState();
    expect(store.theme).toBe('light');

    store.setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');

    store.setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('manages inspector and command palette open states', () => {
    const store = useUIStore.getState();
    expect(store.inspectorOpen).toBe(false);

    store.setInspectorOpen(true);
    expect(useUIStore.getState().inspectorOpen).toBe(true);

    store.toggleInspector();
    expect(useUIStore.getState().inspectorOpen).toBe(false);

    store.setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });
});
