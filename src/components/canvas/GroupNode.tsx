'use client';

import * as React from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupNodeData {
  groupId: string;
  label: string;
  color: string;
  onDeleteGroup?: (id: string) => void;
  onUpdateLabel?: (id: string, label: string) => void;
}

const GROUP_BG_COLORS: Record<string, string> = {
  teal: 'bg-story-teal-bg/30 border-story-teal-border/70 text-story-teal-text',
  coral: 'bg-story-coral-bg/30 border-story-coral-border/70 text-story-coral-text',
  sun: 'bg-story-sun-bg/30 border-story-sun-border/70 text-story-sun-text',
  sky: 'bg-story-sky-bg/30 border-story-sky-border/70 text-story-sky-text',
  lavender: 'bg-story-lavender-bg/30 border-story-lavender-border/70 text-story-lavender-text',
  mint: 'bg-story-mint-bg/30 border-story-mint-border/70 text-story-mint-text',
  rose: 'bg-story-rose-bg/30 border-story-rose-border/70 text-story-rose-text',
  slate: 'bg-story-slate-bg/30 border-story-slate-border/70 text-story-slate-text',
};

export function GroupNode({ id, data, selected }: NodeProps & { data: GroupNodeData }) {
  const [label, setLabel] = React.useState(data.label || 'Group');
  const [isEditing, setIsEditing] = React.useState(false);

  const colorClasses = GROUP_BG_COLORS[data.color] || GROUP_BG_COLORS.slate;

  return (
    <div
      className={cn(
        'group relative h-full w-full rounded-md border-2 border-dashed transition-all',
        colorClasses,
        selected && 'border-solid border-brand shadow-sm'
      )}
    >
      <NodeResizer
        minWidth={250}
        minHeight={180}
        isVisible={selected}
        lineClassName="border-brand"
        handleClassName="h-2.5 w-2.5 bg-surface border-2 border-brand rounded-xs"
      />

      {/* Group Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line/40 bg-surface/50 backdrop-blur-xs rounded-t-md">
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              data.onUpdateLabel?.(data.groupId || id, label);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                data.onUpdateLabel?.(data.groupId || id, label);
              }
            }}
            autoFocus
            className="rounded-xs border border-line bg-surface px-1.5 py-0.5 text-xs font-semibold text-ink outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => setIsEditing(true)}
            className="text-xs font-semibold tracking-wide uppercase cursor-pointer hover:underline"
          >
            {label}
          </span>
        )}

        {data.onDeleteGroup && (
          <button
            type="button"
            onClick={() => data.onDeleteGroup?.(data.groupId || id)}
            className="p-1 text-ink-soft opacity-0 group-hover:opacity-100 hover:text-coral transition-opacity"
            title="Delete grouping box"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
export default React.memo(GroupNode);
