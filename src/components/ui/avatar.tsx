'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Reset image error state whenever src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  // Check if image errored before React hydration or failed to load
  React.useEffect(() => {
    if (src && imgRef.current) {
      if (imgRef.current.complete && imgRef.current.naturalWidth === 0) {
        setImageError(true);
      }
    }
  }, [src]);

  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const hasValidSrc = Boolean(src && typeof src === 'string' && src.trim().length > 0 && !imageError);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-sunken font-semibold text-ink-soft select-none',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {hasValidSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src!}
          alt={alt || name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name || alt)}</span>
      )}
    </div>
  );
}
