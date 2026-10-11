'use client';

import * as React from 'react';
import { useStoryMapStore } from '@/stores/story-map-store';
import { Chip } from '@/components/ui/chip';
import { ChevronUp, MoveLeft, MoveRight, X } from 'lucide-react';
import { STATUS_VARIANTS } from '@/components/scenes/SceneCard';

export function SequenceTray() {
  const {
    nodes,
    sequenceTrayOpen,
    setSequenceTrayOpen,
    reorderSequence,
    setInspectedScene,
    allScenes,
  } = useStoryMapStore();

  const orderedNodes = React.useMemo(() => {
    return nodes
      .filter((n) => n.data.sequenceIndex !== null)
      .sort((a, b) => (a.data.sequenceIndex ?? 0) - (b.data.sequenceIndex ?? 0));
  }, [nodes]);

  const unplacedNodes = React.useMemo(() => {
    return nodes.filter((n) => n.data.sequenceIndex === null);
  }, [nodes]);

  const handleMoveNode = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedNodes.length) return;

    const newOrder = [...orderedNodes.map((n) => n.id)];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    reorderSequence(newOrder);
  };

  const handleInspect = (sceneId: string) => {
    const fullScene = allScenes.find((s) => s.id === sceneId);
    if (fullScene) {
      setInspectedScene(fullScene);
    }
  };

  if (!sequenceTrayOpen) {
    return (
      <button
        type="button"
        onClick={() => setSequenceTrayOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-line bg-surface/95 px-4 py-2 text-xs font-semibold text-ink shadow-sm backdrop-blur-md transition-all hover:bg-surface-sunken hover:border-brand hover:shadow-md"
        title="Open Sequence Tray (Keyboard-accessible sequence order)"
      >
        <span className="flex h-2 w-2 rounded-full bg-brand" />
        Sequence Tray ({orderedNodes.length})
        <ChevronUp className="h-3.5 w-3.5 text-ink-soft" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface/95 shadow-lg backdrop-blur-md transition-all">
      {/* Tray Header */}
      <div className="flex h-10 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-brand" />
            Main Path Sequence
          </span>
          <span className="text-ink-soft">
            {orderedNodes.length} placed scenes • {unplacedNodes.length} unplaced
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSequenceTrayOpen(false)}
          className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken"
          title="Close tray"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal Scrollable Scene Cards */}
      <div className="flex gap-2.5 overflow-x-auto p-3 max-h-[160px] scrollbar-thin">
        {orderedNodes.length === 0 ? (
          <div className="flex w-full items-center justify-center py-6 text-xs text-ink-soft">
            No scenes connected in sequence yet. Connect scene nodes on the canvas to form the main path.
          </div>
        ) : (
          orderedNodes.map((node, index) => {
            const statusVariant = STATUS_VARIANTS[node.data.status] || 'teal';
            const isFirst = index === 0;
            const isLast = index === orderedNodes.length - 1;

            return (
              <div
                key={node.id}
                className="group relative flex w-52 shrink-0 flex-col justify-between rounded-md border border-line bg-surface p-2.5 shadow-2xs hover:border-brand/60 transition-all select-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded-sm">
                      #{String(index + 1).padStart(2, '0')}
                    </span>

                    <Chip variant={statusVariant} size="sm">
                      {node.data.status}
                    </Chip>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveNode(index, 'left')}
                        className="p-1 rounded-xs text-ink-soft hover:text-brand disabled:opacity-20 hover:bg-surface-sunken"
                        title="Move earlier in sequence"
                        aria-label={`Move ${node.data.title} earlier`}
                      >
                        <MoveLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveNode(index, 'right')}
                        className="p-1 rounded-xs text-ink-soft hover:text-brand disabled:opacity-20 hover:bg-surface-sunken"
                        title="Move later in sequence"
                        aria-label={`Move ${node.data.title} later`}
                      >
                        <MoveRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <h5
                    onClick={() => handleInspect(node.data.sceneId)}
                    className="text-xs font-semibold text-ink line-clamp-1 hover:underline cursor-pointer"
                    title={node.data.title}
                  >
                    {node.data.title}
                  </h5>

                  <p className="text-[11px] text-ink-soft line-clamp-2 mt-1 leading-snug">
                    {node.data.description || 'No description.'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
