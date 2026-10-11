'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: (DropdownMenuItem | 'separator')[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1.5 min-w-[180px] rounded-sm bg-surface p-1 shadow-md border border-line animate-in fade-in zoom-in-95 duration-[140ms] ease-out',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, idx) => {
            if (item === 'separator') {
              return (
                <div key={idx} className="my-1 h-px bg-line" role="separator" />
              );
            }

            return (
              <button
                key={idx}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors text-left',
                  item.destructive
                    ? 'text-coral hover:bg-story-coral-bg'
                    : 'text-ink hover:bg-surface-sunken hover:text-ink',
                  item.disabled && 'opacity-50 pointer-events-none'
                )}
              >
                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
