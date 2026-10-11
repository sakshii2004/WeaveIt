import * as React from 'react';
import { cn } from '@/lib/utils';

export function calculatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
} {
  if (!password) {
    return { score: 0, label: '', colorClass: 'bg-line' };
  }

  let score = 0;
  if (password.length >= 10) score += 1; // Base requirement per PRD §8.1
  if (password.length >= 14) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 10) {
    return { score: 1, label: 'Too short (min 10 characters)', colorClass: 'bg-coral' };
  }

  switch (score) {
    case 1:
    case 2:
      return { score: 2, label: 'Fair', colorClass: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', colorClass: 'bg-brand' };
    case 4:
    default:
      return { score: 4, label: 'Strong', colorClass: 'bg-emerald-600' };
  }
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, colorClass } = calculatePasswordStrength(password);

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full flex-1 rounded-full transition-colors duration-200',
              step <= score ? colorClass : 'bg-surface-sunken border border-line/60'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-soft">
        <span>Password strength</span>
        <span className="font-medium text-ink">{label}</span>
      </div>
    </div>
  );
}
