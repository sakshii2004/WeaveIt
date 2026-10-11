import { describe, it, expect } from 'vitest';
import { useToastStore } from '@/components/ui/toast';

describe('Toast Store', () => {
  it('adds and removes toasts properly', () => {
    const { addToast, removeToast } = useToastStore.getState();

    const id = addToast({
      title: 'Scene saved',
      description: 'Saved to cloud',
      variant: 'success',
    });

    expect(id).toBeDefined();
    let toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.id === id)).toBe(true);

    removeToast(id);
    toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.id === id)).toBe(false);
  });
});
