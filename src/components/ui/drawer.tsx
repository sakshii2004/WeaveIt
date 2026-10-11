'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
  title?: string;
  description?: string;
}

export function Drawer({
  open,
  onOpenChange,
  children,
  side = 'right',
  className,
  title,
  description,
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/30 backdrop-blur-[1px] transition-opacity duration-[180ms]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-surface shadow-lg border-line w-full max-w-md p-6 transition-transform duration-[220ms] ease-out',
          side === 'right'
            ? 'right-0 border-l rounded-l-md animate-in slide-in-from-right'
            : 'left-0 border-r rounded-r-md animate-in slide-in-from-left',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
            {description && (
              <p className="text-xs text-ink-soft mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close panel"
            className="rounded-sm p-1.5 text-ink-soft hover:bg-surface-sunken hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 text-left">{children}</div>
      </div>
    </div>
  );
}
