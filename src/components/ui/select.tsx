import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, children, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none rounded-sm border bg-surface-sunken px-3.5 pr-10 py-2 text-sm text-ink transition-all duration-[140ms] ease-out',
              'border-line hover:border-ink-soft/40',
              'focus:bg-surface focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
              'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
              error && 'border-coral focus:border-coral focus:ring-coral/20',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            strokeWidth={1.75}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft"
          />
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
Select.displayName = 'Select';
