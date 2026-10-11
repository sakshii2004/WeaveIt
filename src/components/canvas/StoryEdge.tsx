'use client';

import * as React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useStoryMapStore, type StoryEdgeData } from '@/stores/story-map-store';
import { Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps & { data?: StoryEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { removeEdge, updateEdgeType, updateEdgeLabel } = useStoryMapStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState(data?.label || '');

  const edgeType = data?.edgeType || 'sequence';

  // Edge line styling based on edge type
  const edgeStyles: Record<string, { stroke: string; strokeDasharray?: string; strokeWidth: number }> = {
    sequence: { stroke: 'var(--brand)', strokeWidth: 2.5 },
    branch: { stroke: '#01579B', strokeDasharray: '6 4', strokeWidth: 2 },
    cause: { stroke: '#4A148C', strokeWidth: 2 },
    setup_payoff: { stroke: '#B26A00', strokeDasharray: '3 3', strokeWidth: 2 },
  };

  const currentStyle = edgeStyles[edgeType] || edgeStyles.sequence;

  const handleSaveLabel = () => {
    updateEdgeLabel(id, labelInput.trim() || null);
    setIsEditing(false);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: currentStyle.stroke,
          strokeWidth: selected ? currentStyle.strokeWidth + 1 : currentStyle.strokeWidth,
          strokeDasharray: currentStyle.strokeDasharray,
          transition: 'stroke 140ms ease, stroke-width 140ms ease',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1"
        >
          {isEditing ? (
            <div className="flex items-center gap-1 rounded-sm border border-line bg-surface p-1 shadow-md">
              <select
                value={edgeType}
                onChange={(e) => updateEdgeType(id, e.target.value as StoryEdgeData['edgeType'])}
                className="rounded-xs border border-line bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink outline-none"
              >
                <option value="sequence">Sequence (Main)</option>
                <option value="branch">Branch</option>
                <option value="cause">Causality</option>
                <option value="setup_payoff">Setup / Payoff</option>
              </select>

              <input
                type="text"
                placeholder="Label..."
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-24 rounded-xs border border-line bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLabel();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />

              <button
                type="button"
                onClick={handleSaveLabel}
                className="p-1 text-success hover:bg-surface-sunken rounded-xs"
              >
                <Check className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-ink-soft hover:bg-surface-sunken rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                'group flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer',
                edgeType === 'sequence' && 'text-brand border-brand/40',
                edgeType === 'branch' && 'text-story-sky-text border-story-sky-border',
                edgeType === 'cause' && 'text-story-lavender-text border-story-lavender-border',
                edgeType === 'setup_payoff' && 'text-story-sun-text border-story-sun-border'
              )}
            >
              <span>{data?.label || edgeType.replace('_', '/')}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEdge(id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-coral transition-opacity"
                title="Delete edge"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
export default React.memo(StoryEdge);
