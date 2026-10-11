'use client';

import * as React from 'react';
import { useStoryMapStore } from '@/stores/story-map-store';
import { AlertCircle, Info, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GapHintsPopover() {
  const { gapHints, gapHintsOpen, setGapHintsOpen, setInspectedScene, allScenes } = useStoryMapStore();
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setGapHintsOpen(false);
      }
    };

    if (gapHintsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [gapHintsOpen, setGapHintsOpen]);

  if (gapHints.length === 0) return null;

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setGapHintsOpen(!gapHintsOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all shadow-2xs',
          gapHintsOpen
            ? 'border-sun bg-story-sun-bg text-story-sun-text'
            : 'border-line bg-surface text-ink-soft hover:text-ink hover:bg-surface-sunken'
        )}
        title="Quiet Gap Hints (Rule-based suggestions)"
      >
        <AlertCircle className="h-3.5 w-3.5 text-sun" />
        <span>Story Gaps</span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sun text-[10px] font-bold text-white px-1">
          {gapHints.length}
        </span>
      </button>

      {gapHintsOpen && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-80 rounded-md border border-line bg-surface p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-sun" />
              Quiet Gap Hints
            </span>
            <button
              type="button"
              onClick={() => setGapHintsOpen(false)}
              className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
            {gapHints.map((hint) => (
              <div
                key={hint.id}
                onClick={() => {
                  if (hint.type === 'unplaced_scene' || hint.type === 'missing_sequence') {
                    const scene = allScenes.find((s) => s.id === hint.targetId);
                    if (scene) setInspectedScene(scene);
                  }
                }}
                className="group flex flex-col gap-0.5 rounded-sm border border-line/60 bg-surface-sunken/40 p-2 hover:border-brand cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between font-semibold text-ink text-[11px]">
                  <span className="flex items-center gap-1">
                    {hint.severity === 'warning' ? (
                      <AlertCircle className="h-3 w-3 text-coral" />
                    ) : (
                      <Info className="h-3 w-3 text-brand" />
                    )}
                    {hint.title}
                  </span>
                  <ChevronRight className="h-3 w-3 text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-ink-soft leading-relaxed">{hint.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
