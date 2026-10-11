import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors select-none border leading-none',
  {
    variants: {
      variant: {
        default: 'bg-surface-sunken text-ink-soft border-line',
        brand: 'bg-brand-soft text-brand-strong border-brand/20',
        teal: 'bg-story-teal-bg text-story-teal-text border-story-teal-border',
        coral: 'bg-story-coral-bg text-story-coral-text border-story-coral-border',
        sun: 'bg-story-sun-bg text-story-sun-text border-story-sun-border',
        sky: 'bg-story-sky-bg text-story-sky-text border-story-sky-border',
        lavender: 'bg-story-lavender-bg text-story-lavender-text border-story-lavender-border',
        mint: 'bg-story-mint-bg text-story-mint-text border-story-mint-border',
        rose: 'bg-story-rose-bg text-story-rose-text border-story-rose-border',
        slate: 'bg-story-slate-bg text-story-slate-text border-story-slate-border',
      },
      size: {
        sm: 'h-5 text-[11px] px-2 py-0',
        md: 'h-6 text-xs px-2.5 py-0',
        lg: 'h-7 text-sm px-3.5 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  icon?: React.ReactNode;
}

export function Chip({
  className,
  variant,
  size,
  children,
  onRemove,
  icon,
  ...props
}: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size, className }))} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer shrink-0"
          aria-label="Remove"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
