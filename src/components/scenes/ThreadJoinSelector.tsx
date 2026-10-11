'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, GitCommit, Check } from 'lucide-react';
import type { Thread } from '@/db/schema';

// Color map for thread dots
const THREAD_COLORS: Record<string, string> = {
  teal: 'bg-story-teal-text border-story-teal-bg',
  coral: 'bg-story-coral-text border-story-coral-bg',
  sun: 'bg-story-sun-text border-story-sun-bg',
  sky: 'bg-story-sky-text border-story-sky-bg',
  lavender: 'bg-story-lavender-text border-story-lavender-bg',
  mint: 'bg-story-mint-text border-story-mint-bg',
  rose: 'bg-story-rose-text border-story-rose-bg',
  slate: 'bg-story-slate-text border-story-slate-bg',
};

interface ThreadJoinSelectorProps {
  allThreads: Thread[];
  selectedThreadIds: string[];
  onChange: (updatedIds: string[]) => void;
}

export function ThreadJoinSelector({
  allThreads,
  selectedThreadIds,
  onChange,
}: ThreadJoinSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (threadId: string) => {
    if (selectedThreadIds.includes(threadId)) {
      onChange(selectedThreadIds.filter((id) => id !== threadId));
    } else {
      onChange([...selectedThreadIds, threadId]);
    }
  };

  const handleRemove = (threadId: string) => {
    onChange(selectedThreadIds.filter((id) => id !== threadId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <GitCommit className="h-3.5 w-3.5 text-brand" /> Story Threads
        </label>

        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Link Thread
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 top-8 z-50 w-60 rounded-md border border-line bg-surface p-2 shadow-md animate-in fade-in zoom-in-95 duration-150">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allThreads.length === 0 ? (
                  <p className="p-2 text-center text-xs text-ink-soft">
                    No threads created yet. Add one in Structure Management.
                  </p>
                ) : (
                  allThreads.map((thread) => {
                    const isSelected = selectedThreadIds.includes(thread.id);
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => handleToggle(thread.id)}
                        className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-brand-soft text-brand-strong font-medium'
                            : 'hover:bg-surface-sunken text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              THREAD_COLORS[thread.color] || 'bg-brand'
                            }`}
                          />
                          <span className="truncate">{thread.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Threads Chips */}
      {selectedThreadIds.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line bg-surface-sunken/50 p-2.5 text-center">
          <p className="text-xs text-ink-soft">No story threads linked.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selectedThreadIds.map((tid) => {
            const thread = allThreads.find((t) => t.id === tid);
            if (!thread) return null;
            return (
              <span
                key={tid}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink shadow-2xs"
              >
                <span
                  className={`h-2 w-2 rounded-full ${THREAD_COLORS[thread.color] || 'bg-brand'}`}
                />
                <span className="font-medium">{thread.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(tid)}
                  className="text-ink-soft hover:text-coral transition-colors ml-0.5"
                  title="Remove thread"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
