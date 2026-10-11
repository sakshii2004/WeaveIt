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

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-sunken font-semibold text-ink-soft select-none',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials(name || alt)}</span>
      )}
    </div>
  );
}
