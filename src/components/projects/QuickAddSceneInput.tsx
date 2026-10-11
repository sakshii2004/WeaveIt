'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { quickAddSceneAction } from '@/app/actions/projects';
import { useToast } from '@/components/ui/toast';
import { Plus, Check, Loader2 } from 'lucide-react';
import type { Scene } from '@/db/schema';

export interface QuickAddSceneInputProps {
  projectId: string;
  onSceneCreated?: (scene: Scene) => void;
}

export function QuickAddSceneInput({ projectId, onSceneCreated }: QuickAddSceneInputProps) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setSubmitting(true);
    const res = await quickAddSceneAction(projectId, cleanTitle);
    setSubmitting(false);

    if (!res.success || !res.data) {
      toast({
        title: 'Could not create scene',
        description: res.error || 'Failed to save scene stub',
        variant: 'error',
      });
      return;
    }

    setTitle('');
    setShowSavedIndicator(true);
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2500);

    onSceneCreated?.(res.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative flex items-center">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a scene... (e.g. She runs into him at the Jaipur railway station)"
          className="pr-24 h-11 text-sm bg-surface shadow-xs border-line focus:border-brand"
          disabled={submitting}
        />

        <div className="absolute right-1.5 flex items-center gap-1.5">
          {showSavedIndicator && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-story-mint-text bg-story-mint-bg px-2 py-0.5 rounded-sm animate-in fade-in duration-200">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!title.trim() || submitting}
            className="h-8 gap-1 text-xs"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-soft px-1">
        <span>Type a moment, dialogue, or fragment &amp; press Enter</span>
        <kbd className="hidden sm:inline-block rounded bg-surface-sunken border border-line px-1.5 py-0.2 text-[10px] text-ink-soft">
          ↵ Enter to save
        </kbd>
      </div>
    </form>
  );
}
