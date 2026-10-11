'use client';

import * as React from 'react';
import type { BeatType } from '@/lib/validators/play';
import { MessageSquare, Clapperboard, FileText, Compass, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlashTypeOption {
  type: BeatType;
  label: string;
  description: string;
  icon: React.ElementType;
  shortcut: string;
}

export const SLASH_OPTIONS: SlashTypeOption[] = [
  {
    type: 'dialogue',
    label: 'Dialogue',
    description: 'Spoken line by a character with small-caps name',
    icon: MessageSquare,
    shortcut: '1',
  },
  {
    type: 'action',
    label: 'Action',
    description: 'Physical movement, events, or scene description',
    icon: Clapperboard,
    shortcut: '2',
  },
  {
    type: 'narrator_note',
    label: 'Narrator Note',
    description: 'Internal realization, dramatic irony, or novelist note',
    icon: FileText,
    shortcut: '3',
  },
  {
    type: 'direction',
    label: 'Direction',
    description: 'Parenthetical, stage direction, or delivery tone',
    icon: Compass,
    shortcut: '4',
  },
];

interface SlashTypeMenuProps {
  currentType: BeatType;
  onSelect: (type: BeatType) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export function SlashTypeMenu({
  currentType,
  onSelect,
  onClose,
  position = 'bottom',
}: SlashTypeMenuProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % SLASH_OPTIONS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + SLASH_OPTIONS.length) % SLASH_OPTIONS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(SLASH_OPTIONS[selectedIndex].type);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (SLASH_OPTIONS[idx]) {
          e.preventDefault();
          onSelect(SLASH_OPTIONS[idx].type);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-50 w-72 rounded-md border border-line bg-surface p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150',
        position === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
        'left-0'
      )}
    >
      <div className="px-2 py-1 border-b border-line/60 mb-1 flex items-center justify-between text-[11px] text-ink-soft">
        <span className="font-semibold uppercase tracking-wider text-[10px]">Switch Beat Type</span>
        <span className="text-[10px] text-ink-soft/70">↑↓ or 1-4</span>
      </div>

      <div className="space-y-0.5">
        {SLASH_OPTIONS.map((opt, idx) => {
          const Icon = opt.icon;
          const isSelected = idx === selectedIndex;
          const isCurrent = opt.type === currentType;

          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => onSelect(opt.type)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full flex items-start gap-2.5 rounded-sm p-2 text-left text-xs transition-colors',
                isSelected ? 'bg-brand-soft text-brand-strong' : 'text-ink hover:bg-surface-sunken'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 rounded-xs p-1',
                  isSelected ? 'bg-brand/10 text-brand' : 'bg-surface-sunken text-ink-soft'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    {opt.label}
                    {isCurrent && <Check className="h-3 w-3 text-brand" />}
                  </span>
                  <kbd className="text-[10px] text-ink-soft/70 font-mono bg-surface-sunken px-1 rounded-xs border border-line">
                    {opt.shortcut}
                  </kbd>
                </div>
                <p className="text-[11px] text-ink-soft leading-tight mt-0.5 truncate">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
