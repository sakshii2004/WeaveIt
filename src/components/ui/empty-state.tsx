import * as React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-md border border-dashed border-line bg-surface/50 max-w-lg mx-auto my-6',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
        {icon || (
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} variant="primary" size="md">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
