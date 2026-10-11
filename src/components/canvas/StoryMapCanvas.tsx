'use client';

import * as React from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStoryMapStore } from '@/stores/story-map-store';
import SceneNode from './SceneNode';
import StoryEdge from './StoryEdge';
import GroupNode from './GroupNode';
import { AlertCircle, X } from 'lucide-react';

const nodeTypes = {
  sceneNode: SceneNode,
  groupNode: GroupNode,
};

const edgeTypes = {
  storyEdge: StoryEdge,
};

export interface StoryMapCanvasProps {
  onOpenCreateScene: () => void;
}

export function StoryMapCanvas({ onOpenCreateScene }: StoryMapCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    connectEdge,
    snapToGrid,
    undo,
    redo,
    validationError,
    clearValidationError,
  } = useStoryMapStore();

  const handleConnect = React.useCallback(
    (connection: Connection) => {
      connectEdge(connection);
    },
    [connectEdge]
  );

  const handleNodeDragStart = React.useCallback(() => {
    const { nodes, edges, past } = useStoryMapStore.getState();
    useStoryMapStore.setState({
      past: [...past.slice(-29), { nodes, edges }],
      future: [],
    });
  }, []);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // N: New Scene
      if (e.key === 'n' || e.key === 'N') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          onOpenCreateScene();
        }
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCreateScene, undo, redo]);

  return (
    <div className="relative h-full flex-1 w-full overflow-hidden bg-bg">
      {/* Validation Error Toast */}
      {validationError && (
        <div className="absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-md border border-coral bg-story-coral-bg px-3.5 py-2 text-xs font-medium text-story-coral-text shadow-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
          <button
            type="button"
            onClick={clearValidationError}
            className="p-0.5 rounded-xs hover:bg-black/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={handleNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 50, y: 50, zoom: 0.9 }}
        onlyRenderVisibleElements={true}
        className="touch-none select-none"
      >
        {snapToGrid && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={24}
            lineWidth={1}
            color="var(--line)"
          />
        )}
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4 !border !border-line !bg-surface/95 !backdrop-blur-md !shadow-sm !rounded-md"
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'groupNode') return 'var(--line-strong, #CBD5E1)';
            return 'var(--brand, #0F7C8A)';
          }}
          maskColor="rgba(0, 0, 0, 0.06)"
          className="!bottom-4 !right-4 !w-44 !h-28 !border !border-line !bg-surface/95 !backdrop-blur-md !shadow-sm !rounded-md !overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
