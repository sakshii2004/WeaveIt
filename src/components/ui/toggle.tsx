'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-[180ms] ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          checked ? 'bg-brand' : 'bg-line hover:bg-line/90 dark:bg-surface-sunken dark:border dark:border-line'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-[180ms] ease-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-sm font-medium text-ink">{label}</span>}
          {description && (
            <span className="text-xs text-ink-soft">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
