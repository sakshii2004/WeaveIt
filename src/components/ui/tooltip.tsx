'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 120);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 rounded-md border border-line/90 bg-surface/95 px-3 py-2 text-[11px] font-normal text-ink shadow-lg backdrop-blur-md w-max max-w-[280px] sm:max-w-xs whitespace-normal text-left leading-relaxed animate-in fade-in zoom-in-95 duration-140 ease-out select-none',
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export interface FieldInfoProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function FieldInfo({ content, position = 'top', className }: FieldInfoProps) {
  return (
    <Tooltip content={content} position={position}>
      <span
        tabIndex={0}
        aria-label="More information"
        className={cn(
          'inline-flex items-center justify-center text-ink-soft/70 hover:text-ink cursor-help transition-colors rounded-full focus:outline-none focus:ring-1 focus:ring-brand ml-1',
          className
        )}
      >
        <Info className="h-3.5 w-3.5 stroke-[1.75]" />
      </span>
    </Tooltip>
  );
}
