import * as React from 'react';
import { cn } from '@/lib/utils';

export function AuthDivider({
  label = 'or continue with email',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative my-5 flex items-center justify-center', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative bg-surface px-3 text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
    </div>
  );
}
