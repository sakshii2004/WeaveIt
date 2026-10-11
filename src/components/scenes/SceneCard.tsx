'use client';

import * as React from 'react';
import { Chip, type ChipProps } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { timeAgo } from '@/lib/utils';
import { MapPin, Clock, Trash2, GitCommit, Layers } from 'lucide-react';
import type { SceneWithDetails } from '@/db/queries/scenes';
import type { Act } from '@/db/schema';

export const STATUS_VARIANTS: Record<string, ChipProps['variant']> = {
  seed: 'sun',
  sketched: 'sky',
  planned: 'teal',
  played: 'mint',
  drafted: 'lavender',
};

const ACT_COLOR_CLASSES: Record<string, string> = {
  teal: 'border-l-story-teal-text',
  coral: 'border-l-story-coral-text',
  sun: 'border-l-story-sun-text',
  sky: 'border-l-story-sky-text',
  lavender: 'border-l-story-lavender-text',
  mint: 'border-l-story-mint-text',
  rose: 'border-l-story-rose-text',
  slate: 'border-l-story-slate-text',
};

const THREAD_DOT_CLASSES: Record<string, string> = {
  teal: 'bg-story-teal-text',
  coral: 'bg-story-coral-text',
  sun: 'bg-story-sun-text',
  sky: 'bg-story-sky-text',
  lavender: 'bg-story-lavender-text',
  mint: 'bg-story-mint-text',
  rose: 'bg-story-rose-text',
  slate: 'bg-story-slate-text',
};

export interface SceneCardProps {
  scene: SceneWithDetails;
  index: number;
  acts: Act[];
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function SceneCard({
  scene,
  index,
  acts,
  onClick,
  onDelete,
}: SceneCardProps) {
  const act = scene.actId ? acts.find((a) => a.id === scene.actId) : scene.act;
  const effectiveColor = scene.color || act?.color;
  const isHex = effectiveColor?.startsWith('#');
  const actBorderClass = !isHex && effectiveColor ? ACT_COLOR_CLASSES[effectiveColor] || 'border-l-brand' : (!isHex && !effectiveColor ? 'border-l-line' : '');

  const statusVariant = STATUS_VARIANTS[scene.status] || 'teal';
  const statusLabel = scene.status.charAt(0).toUpperCase() + scene.status.slice(1);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-md border border-line bg-surface p-4 transition-all duration-[140ms] hover:border-ink-soft/40 hover:shadow-2xs cursor-pointer border-l-4 ${actBorderClass}`}
      style={isHex ? { borderLeftColor: effectiveColor } : undefined}
    >
      <div className="space-y-2.5">
        {/* Top Header: Sequence Index, Status, Scene Type, Act Chip */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-ink-soft/70">
              #{String(index + 1).padStart(2, '0')}
            </span>

            <Chip variant={statusVariant} size="sm">
              {statusLabel}
            </Chip>

            {scene.sceneType && (
              <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-ink-soft border border-line capitalize">
                {scene.sceneType.replace('_', ' ')}
              </span>
            )}

            {act && (
              <span className="text-[11px] font-medium text-ink-soft flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${THREAD_DOT_CLASSES[act.color] || 'bg-brand'}`} />
                {act.name}
              </span>
            )}

            {scene.chapter && (
              <span className="text-[11px] font-medium text-ink-soft/80 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {scene.chapter.title}
              </span>
            )}
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink-soft hover:text-coral rounded-sm"
              title="Delete scene"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-ink group-hover:text-brand transition-colors line-clamp-1">
          {scene.title}
        </h4>

        {/* Description snippet in Source Serif 4 style */}
        {scene.description ? (
          <p className="font-serif text-xs text-ink-soft line-clamp-2 leading-relaxed">
            {scene.description}
          </p>
        ) : (
          <p className="text-[11px] italic text-ink-soft/50">No description entered yet</p>
        )}
      </div>

      {/* Card Footer: Cast Avatars, Threads, Location, Time */}
      <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between gap-3 text-xs text-ink-soft">
        <div className="flex items-center gap-3 min-w-0">
          {/* Cast Avatars */}
          {scene.characters && scene.characters.length > 0 && (
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {scene.characters.slice(0, 4).map((c) => (
                <Tooltip key={c.character.id} content={`${c.character.name}${c.roleInScene ? ` (${c.roleInScene})` : ''}`}>
                  <Avatar
                    name={c.character.name}
                    src={c.character.imageUrl ?? undefined}
                    size="sm"
                    className="h-5 w-5 ring-2 ring-surface text-[9px]"
                  />
                </Tooltip>
              ))}
              {scene.characters.length > 4 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-sunken text-[9px] font-semibold text-ink-soft ring-2 ring-surface">
                  +{scene.characters.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Thread Dots */}
          {scene.threads && scene.threads.length > 0 && (
            <div className="flex items-center gap-1">
              <GitCommit className="h-3 w-3 text-ink-soft/60" />
              {scene.threads.map((t) => (
                <Tooltip key={t.id} content={t.name}>
                  <span
                    className={`h-2 w-2 rounded-full ${THREAD_DOT_CLASSES[t.color] || 'bg-brand'}`}
                  />
                </Tooltip>
              ))}
            </div>
          )}

          {/* Location Badge */}
          {scene.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft truncate max-w-[120px]">
              <MapPin className="h-3 w-3 shrink-0 text-brand" />
              <span className="truncate">{scene.location.name}</span>
            </span>
          )}
        </div>

        {/* Time info */}
        <div className="flex items-center gap-2 shrink-0 text-[11px] text-ink-soft">
          {scene.timeLabel && (
            <span className="inline-flex items-center gap-1 rounded bg-surface-sunken px-1.5 py-0.2">
              <Clock className="h-3 w-3" />
              <span>{scene.timeLabel}</span>
            </span>
          )}
          <span>{timeAgo(scene.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
