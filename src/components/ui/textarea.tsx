import * as React from 'react';
import { cn } from '@/lib/utils';
import { FieldInfo } from '@/components/ui/tooltip';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  isWritingSurface?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, isWritingSurface = false, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold uppercase tracking-wider text-ink-soft"
            >
              {label}
            </label>
            {hint && <FieldInfo content={hint} />}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-sm border bg-surface-sunken px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 transition-all duration-[140ms] ease-out',
            'border-line hover:border-ink-soft/40',
            'focus:bg-surface focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isWritingSurface && 'font-serif text-[17px] leading-relaxed',
            error && 'border-coral focus:border-coral focus:ring-coral/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-coral font-medium">{error}</p>
        ) : !label && hint ? (
          <div className="flex justify-end">
            <FieldInfo content={hint} />
          </div>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
