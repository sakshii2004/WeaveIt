'use client';

import * as React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = (toast: Omit<ToastItem, 'id'>) => useToastStore.getState().addToast(toast);

export function useToast() {
  const { addToast, removeToast } = useToastStore();
  return {
    toast: addToast,
    dismiss: removeToast,
    info: (title: string, description?: string) =>
      addToast({ title, description, variant: 'info' }),
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'success' }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, variant: 'warning' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'error' }),
  };
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const { duration = 5000, variant = 'info' } = toast;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const icons = {
    info: <Info className="h-5 w-5 text-brand shrink-0" strokeWidth={1.75} />,
    success: (
      <CheckCircle2 className="h-5 w-5 text-success shrink-0" strokeWidth={1.75} />
    ),
    warning: (
      <AlertTriangle className="h-5 w-5 text-sun shrink-0" strokeWidth={1.75} />
    ),
    error: (
      <AlertCircle className="h-5 w-5 text-coral shrink-0" strokeWidth={1.75} />
    ),
  };

  const borders = {
    info: 'border-l-4 border-l-brand',
    success: 'border-l-4 border-l-success',
    warning: 'border-l-4 border-l-sun',
    error: 'border-l-4 border-l-coral',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-md bg-surface p-4 shadow-md border border-line text-ink transition-all duration-[220ms] ease-out animate-in slide-in-from-bottom-2',
        borders[variant]
      )}
    >
      {icons[variant]}
      <div className="flex-1 space-y-0.5 text-left">
        <h4 className="text-sm font-semibold text-ink leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-xs text-ink-soft leading-normal">
            {toast.description}
          </p>
        )}
        {toast.action && <div className="pt-1.5">{toast.action}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-sm p-1 text-ink-soft hover:bg-surface-sunken hover:text-ink focus:outline-none focus:ring-1 focus:ring-brand"
        aria-label="Dismiss toast"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
