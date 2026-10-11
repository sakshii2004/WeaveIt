import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-[180ms] ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-white hover:bg-brand-strong active:scale-[0.98] shadow-sm',
        secondary:
          'bg-surface border border-line text-ink hover:bg-surface-sunken hover:border-ink-soft/30 active:scale-[0.98]',
        ghost:
          'text-ink-soft hover:text-ink hover:bg-surface-sunken active:scale-[0.98]',
        destructive:
          'bg-coral text-white hover:opacity-90 active:scale-[0.98] shadow-sm',
        subtle:
          'bg-brand-soft text-brand-strong hover:bg-brand-soft/80 active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-sm',
        md: 'h-9 px-4 text-sm rounded-sm',
        lg: 'h-11 px-5 text-base rounded-sm',
        icon: 'h-9 w-9 p-0 rounded-sm',
        'icon-sm': 'h-7 w-7 p-0 rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
