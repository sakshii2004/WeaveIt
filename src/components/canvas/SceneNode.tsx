'use client';

import * as React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Chip } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { useStoryMapStore, type SceneNodeData } from '@/stores/story-map-store';
import { STATUS_VARIANTS } from '@/components/scenes/SceneCard';
import { Edit2, Trash2, Layers, BookOpen, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STORY_COLORS } from '@/components/structure/StructureManagementModal';
import { updateSceneAction } from '@/app/actions/scenes';

export const STORY_CARD_THEMES: Record<
  string,
  { bar: string; border: string; bg: string; badge: string; shadow: string }
> = {
  teal: {
    bar: 'bg-story-teal-text',
    border: 'border-story-teal-border',
    bg: 'bg-gradient-to-b from-story-teal-bg/40 to-surface',
    badge: 'bg-story-teal-bg text-story-teal-text border-story-teal-border',
    shadow: 'hover:shadow-teal-500/10',
  },
  coral: {
    bar: 'bg-story-coral-text',
    border: 'border-story-coral-border',
    bg: 'bg-gradient-to-b from-story-coral-bg/40 to-surface',
    badge: 'bg-story-coral-bg text-story-coral-text border-story-coral-border',
    shadow: 'hover:shadow-coral-500/10',
  },
  sun: {
    bar: 'bg-story-sun-text',
    border: 'border-story-sun-border',
    bg: 'bg-gradient-to-b from-story-sun-bg/40 to-surface',
    badge: 'bg-story-sun-bg text-story-sun-text border-story-sun-border',
    shadow: 'hover:shadow-amber-500/10',
  },
  sky: {
    bar: 'bg-story-sky-text',
    border: 'border-story-sky-border',
    bg: 'bg-gradient-to-b from-story-sky-bg/40 to-surface',
    badge: 'bg-story-sky-bg text-story-sky-text border-story-sky-border',
    shadow: 'hover:shadow-sky-500/10',
  },
  lavender: {
    bar: 'bg-story-lavender-text',
    border: 'border-story-lavender-border',
    bg: 'bg-gradient-to-b from-story-lavender-bg/40 to-surface',
    badge: 'bg-story-lavender-bg text-story-lavender-text border-story-lavender-border',
    shadow: 'hover:shadow-purple-500/10',
  },
  mint: {
    bar: 'bg-story-mint-text',
    border: 'border-story-mint-border',
    bg: 'bg-gradient-to-b from-story-mint-bg/40 to-surface',
    badge: 'bg-story-mint-bg text-story-mint-text border-story-mint-border',
    shadow: 'hover:shadow-emerald-500/10',
  },
  rose: {
    bar: 'bg-story-rose-text',
    border: 'border-story-rose-border',
    bg: 'bg-gradient-to-b from-story-rose-bg/40 to-surface',
    badge: 'bg-story-rose-bg text-story-rose-text border-story-rose-border',
    shadow: 'hover:shadow-rose-500/10',
  },
  slate: {
    bar: 'bg-story-slate-text',
    border: 'border-story-slate-border',
    bg: 'bg-gradient-to-b from-story-slate-bg/40 to-surface',
    badge: 'bg-story-slate-bg text-story-slate-text border-story-slate-border',
    shadow: 'hover:shadow-slate-500/10',
  },
};

const THREAD_DOT_COLORS: Record<string, string> = {
  teal: 'bg-story-teal-text',
  coral: 'bg-story-coral-text',
  sun: 'bg-story-sun-text',
  sky: 'bg-story-sky-text',
  lavender: 'bg-story-lavender-text',
  mint: 'bg-story-mint-text',
  rose: 'bg-story-rose-text',
  slate: 'bg-story-slate-text',
};

export function SceneNode({ id, data, selected }: NodeProps & { data: SceneNodeData }) {
  const { allScenes, setInspectedScene, removeNode, updateSceneData } = useStoryMapStore();
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);

  const effectiveColor = data.color || data.act?.color;
  const theme = effectiveColor ? STORY_CARD_THEMES[effectiveColor] : null;
  const statusVariant = STATUS_VARIANTS[data.status] || 'teal';
  const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);

  const formattedSeq =
    data.sequenceIndex !== null
      ? `#${String(data.sequenceIndex + 1).padStart(2, '0')}`
      : '#--';

  const handleOpenInspector = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullScene = allScenes.find((s) => s.id === data.sceneId);
    if (fullScene) {
      setInspectedScene(fullScene);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleSetColor = async (colorKey: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setColorPickerOpen(false);
    updateSceneData(data.sceneId, { color: colorKey });
    await updateSceneAction(data.sceneId, { color: colorKey });
  };

  return (
    <div
      onDoubleClick={handleOpenInspector}
      className={cn(
        'group relative w-[280px] select-none rounded-xl border text-ink transition-all duration-[140ms]',
        'shadow-xs hover:shadow-md',
        theme ? cn(theme.border, theme.bg, theme.shadow) : 'border-line bg-surface',
        selected && 'ring-2 ring-brand ring-offset-2 ring-offset-surface shadow-md border-transparent',
        data.isDimmed && 'opacity-25 hover:opacity-100 pointer-events-auto'
      )}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={true}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-surface !bg-brand-strong transition-transform group-hover:scale-125 !cursor-crosshair shadow-2xs"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={true}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-surface !bg-brand transition-transform group-hover:scale-125 !cursor-crosshair shadow-2xs"
      />

      {/* Act / Scene Color Top Bar */}
      <div
        className={cn(
          'h-1.5 w-full rounded-t-[11px] transition-colors',
          theme ? theme.bar : 'bg-line'
        )}
      />

      {/* Card Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Top Header: Sequence Badge, Status Chip, Scene Type, Quick Actions */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'font-mono text-xs font-bold px-1.5 py-0.5 rounded-sm',
                data.sequenceIndex !== null
                  ? 'bg-brand-soft text-brand-strong'
                  : 'bg-surface-sunken text-ink-soft'
              )}
              title={data.sequenceIndex !== null ? `Sequence #${data.sequenceIndex + 1}` : 'Unplaced fragment'}
            >
              {formattedSeq}
            </span>

            <Chip variant={statusVariant} size="sm">
              {statusLabel}
            </Chip>

            {data.sceneType && (
              <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-soft border border-line capitalize">
                {data.sceneType.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Hover Actions */}
          <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColorPickerOpen(!colorPickerOpen);
              }}
              className="p-1 rounded-sm text-ink-soft hover:text-brand hover:bg-surface-sunken transition-colors"
              title="Change card color"
            >
              <Palette className="h-3 w-3" />
            </button>

            {colorPickerOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 z-50 flex items-center gap-1 rounded-md border border-line bg-surface p-1.5 shadow-md"
              >
                {STORY_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={(e) => handleSetColor(c.key, e)}
                    className={cn(
                      'h-3.5 w-3.5 rounded-full transition-transform hover:scale-125',
                      c.bgClass,
                      data.color === c.key && 'ring-2 ring-brand ring-offset-1'
                    )}
                    title={c.label}
                  />
                ))}
                <button
                  type="button"
                  onClick={(e) => handleSetColor(null, e)}
                  className="px-1 text-[10px] text-ink-soft hover:text-coral hover:bg-surface-sunken rounded-xs"
                  title="Clear color"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenInspector}
              className="p-1 rounded-sm text-ink-soft hover:text-brand hover:bg-surface-sunken transition-colors"
              title="Open Scene Inspector"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded-sm text-ink-soft hover:text-coral hover:bg-surface-sunken transition-colors"
              title="Remove from map"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Scene Title */}
        <h4 className="text-sm font-semibold tracking-tight text-ink line-clamp-1 group-hover:text-brand transition-colors">
          {data.title}
        </h4>

        {/* 2-line Description Preview */}
        <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed min-h-[2rem]">
          {data.description || <span className="italic text-ink-soft/60">No description yet.</span>}
        </p>

        {/* Footer: Act/Chapter tag, Avatars, Thread Dots */}
        <div className="pt-1.5 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
          {/* Left: Act or Chapter Indicator */}
          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
            {data.chapter ? (
              <span className="flex items-center gap-1 truncate text-ink-soft font-medium" title={data.chapter.title}>
                <BookOpen className="h-3 w-3 shrink-0 text-ink-soft/70" />
                <span className="truncate">{data.chapter.title}</span>
              </span>
            ) : data.act ? (
              <span className="flex items-center gap-1 truncate text-ink-soft font-medium" title={data.act.name}>
                <Layers className="h-3 w-3 shrink-0 text-ink-soft/70" />
                <span className="truncate">{data.act.name}</span>
              </span>
            ) : (
              <span className="text-ink-soft/60 italic">No structure</span>
            )}
          </div>

          {/* Right: Avatars & Thread Dots */}
          <div className="flex items-center gap-2">
            {/* Thread dots */}
            {data.threads.length > 0 && (
              <div className="flex items-center -space-x-1" title={`${data.threads.length} Threads`}>
                {data.threads.slice(0, 3).map((th) => (
                  <span
                    key={th.id}
                    className={cn('h-2 w-2 rounded-full border border-surface ring-1 ring-line', THREAD_DOT_COLORS[th.color] || 'bg-brand')}
                  />
                ))}
              </div>
            )}

            {/* Character avatars */}
            {data.characters.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {data.characters.slice(0, 3).map((c) => (
                  <Tooltip key={c.character.id} content={c.character.name}>
                    <Avatar
                      src={c.character.imageUrl || undefined}
                      name={c.character.name}
                      size="sm"
                      className="h-5 w-5 text-[9px] border border-line bg-surface-sunken ring-1 ring-surface shadow-2xs"
                    />
                  </Tooltip>
                ))}
                {data.characters.length > 3 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-sunken text-[9px] font-semibold text-ink-soft border border-line ring-1 ring-surface">
                    +{data.characters.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default React.memo(SceneNode);
