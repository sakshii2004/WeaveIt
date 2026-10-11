'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, showPasswordToggle, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isPassword = type === 'password';
    const enableToggle = showPasswordToggle !== undefined ? showPasswordToggle : isPassword;
    const [showPassword, setShowPassword] = React.useState(false);

    const effectiveType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={effectiveType}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-sm border bg-surface-sunken px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/60 transition-all duration-[140ms] ease-out',
              'border-line hover:border-ink-soft/40',
              'focus:bg-surface focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-coral focus:border-coral focus:ring-coral/20',
              enableToggle && isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {enableToggle && isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-coral font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-soft">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
