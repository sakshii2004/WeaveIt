'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  preventOutsideClick?: boolean;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  maxWidth,
  preventOutsideClick = false,
  className,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-[180ms]"
        onClick={() => {
          if (!preventOutsideClick) {
            onOpenChange(false);
          }
        }}
        aria-hidden="true"
      />
      {/* Content wrapper */}
      <div
        className={cn(
          'relative z-10 w-full my-auto',
          maxWidth === 'sm' && 'max-w-sm',
          maxWidth === 'md' && 'max-w-md',
          maxWidth === 'lg' && 'max-w-lg',
          maxWidth === 'xl' && 'max-w-xl',
          maxWidth === '2xl' && 'max-w-2xl',
          maxWidth === '3xl' && 'max-w-3xl',
          maxWidth === '4xl' && 'max-w-4xl',
          maxWidth === '5xl' && 'max-w-5xl',
          maxWidth === '6xl' && 'max-w-6xl',
          maxWidth === '7xl' && 'max-w-7xl',
          maxWidth === 'full' && 'max-w-full',
          !maxWidth && 'max-w-lg',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export function DialogContent({
  className,
  children,
  onClose,
  ...props
}: DialogContentProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'relative w-full rounded-lg bg-surface p-6 shadow-md border border-line animate-in fade-in zoom-in-95 duration-[180ms] ease-out',
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-sm p-1.5 text-ink-soft hover:bg-surface-sunken hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-ink-soft leading-relaxed', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6',
        className
      )}
      {...props}
    />
  );
}
