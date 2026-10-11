'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  (
    {
      name = 'code',
      value: controlledValue,
      defaultValue = '',
      onChange,
      length = 6,
      disabled = false,
      hasError = false,
      className,
      autoFocus = true,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      defaultValue.slice(0, length)
    );

    const currentValue = (isControlled ? controlledValue : internalValue) || '';
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const updateValue = (newValue: string) => {
      const sanitized = newValue.replace(/\D/g, '').slice(0, length);
      if (!isControlled) {
        setInternalValue(sanitized);
      }
      onChange?.(sanitized);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        const chars = currentValue.split('');
        if (chars[index]) {
          // Clear current cell
          chars[index] = '';
          updateValue(chars.join(''));
        } else if (index > 0) {
          // Clear previous cell and focus it
          chars[index - 1] = '';
          updateValue(chars.join(''));
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const val = e.target.value.replace(/\D/g, '');
      if (!val) return;

      const digit = val[val.length - 1]; // Take last character entered
      const chars = currentValue.split('');
      while (chars.length < length) chars.push('');
      chars[index] = digit;
      const combined = chars.join('').slice(0, length);
      updateValue(combined);

      // Advance focus to next cell
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;

      updateValue(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    };

    return (
      <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
        {/* Hidden input for form submission */}
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={currentValue}
          disabled={disabled}
        />

        {Array.from({ length }).map((_, i) => {
          const char = currentValue[i] || '';
          return (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={char}
              autoFocus={autoFocus && i === 0}
              disabled={disabled}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${i + 1} of ${length}`}
              className={cn(
                'w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-semibold',
                'rounded-md border transition-colors outline-none select-none',
                'bg-surface-sunken text-text-primary',
                hasError
                  ? 'border-coral focus:border-coral focus:ring-2 focus:ring-coral/20'
                  : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/20',
                disabled && 'opacity-50 cursor-not-allowed bg-surface-subtle'
              )}
            />
          );
        })}
      </div>
    );
  }
);

OtpInput.displayName = 'OtpInput';
