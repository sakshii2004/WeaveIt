'use client';

import * as React from 'react';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo } from '@/lib/utils';
import { Layers, Clock } from 'lucide-react';
import type { Scene } from '@/db/schema';

export interface RecentScenesListProps {
  scenes: Scene[];
}

export function RecentScenesList({ scenes }: RecentScenesListProps) {
  if (scenes.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface p-8 text-center">
        <EmptyState
          title="No scenes captured yet"
          description="Every novel begins with a fragment. Type your first scene into the quick-add input above to begin shaping your story."
          icon={<Layers className="h-6 w-6 text-brand" strokeWidth={1.75} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scenes.map((scene, idx) => (
        <div
          key={scene.id}
          className="group flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3.5 transition-all duration-[140ms] hover:border-ink-soft/40 hover:shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-semibold text-ink-soft/70 w-6 shrink-0 text-center">
              #{String(idx + 1).padStart(2, '0')}
            </span>

            <Chip variant="teal" size="sm" className="shrink-0">
              {scene.status.charAt(0).toUpperCase() + scene.status.slice(1)}
            </Chip>

            <span className="text-sm font-medium text-ink truncate group-hover:text-brand transition-colors">
              {scene.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-ink-soft shrink-0">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            <span>{timeAgo(scene.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
