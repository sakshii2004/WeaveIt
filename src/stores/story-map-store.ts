import { create } from 'zustand';
import type { Node, Edge, Connection, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { StoryMap, MapGroup, Chapter, Act, Character, Thread, Location } from '@/db/schema';
import type { SceneWithDetails } from '@/db/queries/scenes';
import {
  deriveSequence,
  rewireSequenceOrder,
  calculateAutoArrangeLayout,
  evaluateGapHints,
  type GapHint,
} from '@/lib/sequence';
import { batchUpdateNodePositionsAction } from '@/app/actions/maps';
import { toast } from '@/components/ui/toast';

export interface SceneNodeData extends Record<string, unknown> {
  nodeId: string;
  sceneId: string;
  sequenceIndex: number | null;
  title: string;
  description: string | null;
  status: string;
  sceneType: string | null;
  actId: string | null;
  act: Act | null;
  chapterId: string | null;
  chapter: Chapter | null;
  characters: { character: Character; roleInScene: string | null }[];
  threads: Thread[];
  location: Location | null;
  timeLabel: string | null;
  color: string | null;
  isDimmed: boolean;
  [key: string]: unknown;
}

export interface StoryEdgeData extends Record<string, unknown> {
  edgeId: string;
  edgeType: 'sequence' | 'branch' | 'cause' | 'setup_payoff';
  label: string | null;
  [key: string]: unknown;
}

export interface FilterState {
  actId: string | 'all';
  chapterId: string | 'all';
  threadId: string | 'all';
  characterId: string | 'all';
}

interface HistorySnapshot {
  nodes: Node<SceneNodeData>[];
  edges: Edge<StoryEdgeData>[];
}

interface StoryMapStoreState {
  mapId: string;
  projectId: string;
  map: StoryMap | null;
  nodes: Node<SceneNodeData>[];
  edges: Edge<StoryEdgeData>[];
  groups: MapGroup[];
  chapters: Chapter[];
  acts: Act[];
  allScenes: SceneWithDetails[];
  allCharacters: Character[];
  allThreads: Thread[];
  allLocations: Location[];

  // Selection & Panels
  selectedNodeIds: string[];
  inspectedScene: SceneWithDetails | null;
  snapToGrid: boolean;
  sequenceTrayOpen: boolean;
  chaptersPanelOpen: boolean;
  scenesDrawerOpen: boolean;
  gapHintsOpen: boolean;

  // Filter
  filter: FilterState;

  // Status & Feedback
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  validationError: string | null;
  gapHints: GapHint[];

  // History
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  initialize: (payload: {
    map: StoryMap;
    nodes: Node<SceneNodeData>[];
    edges: Edge<StoryEdgeData>[];
    groups: MapGroup[];
    chapters: Chapter[];
    acts: Act[];
    allScenes: SceneWithDetails[];
    allCharacters: Character[];
    allThreads: Thread[];
    allLocations: Location[];
  }) => void;

  onNodesChange: OnNodesChange<Node<SceneNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<StoryEdgeData>>;
  setNodes: (nodes: Node<SceneNodeData>[]) => void;
  setEdges: (edges: Edge<StoryEdgeData>[]) => void;

  connectEdge: (connection: Connection) => { success: boolean; error?: string };
  removeEdge: (edgeId: string) => void;
  updateEdgeType: (edgeId: string, edgeType: StoryEdgeData['edgeType']) => void;
  updateEdgeLabel: (edgeId: string, label: string | null) => void;

  addPlacedNode: (node: Node<SceneNodeData>) => void;
  removeNode: (nodeId: string) => void;

  reorderSequence: (newOrderedNodeIds: string[]) => void;
  autoArrange: () => void;

  updateSceneData: (sceneId: string, updates: Partial<SceneWithDetails>) => void;
  deleteSceneFromStore: (sceneId: string) => void;

  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;

  toggleSnapToGrid: () => void;
  setSequenceTrayOpen: (open: boolean) => void;
  setChaptersPanelOpen: (open: boolean) => void;
  setScenesDrawerOpen: (open: boolean) => void;
  setGapHintsOpen: (open: boolean) => void;
  setInspectedScene: (scene: SceneWithDetails | null) => void;
  clearValidationError: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Position batch save timer
  triggerSavePositions: () => void;
}

let positionDebounceTimer: NodeJS.Timeout | null = null;

function computeDimmed(node: Node<SceneNodeData>, filter: FilterState): boolean {
  const isAll =
    filter.actId === 'all' &&
    filter.chapterId === 'all' &&
    filter.threadId === 'all' &&
    filter.characterId === 'all';
  if (isAll) return false;

  const data = node.data;
  if (filter.actId !== 'all' && data.actId !== filter.actId) return true;
  if (filter.chapterId !== 'all' && data.chapterId !== filter.chapterId) return true;
  if (filter.threadId !== 'all' && !data.threads.some((t) => t.id === filter.threadId)) return true;
  if (filter.characterId !== 'all' && !data.characters.some((c) => c.character.id === filter.characterId)) return true;

  return false;
}

export const useStoryMapStore = create<StoryMapStoreState>((set, get) => ({
  mapId: '',
  projectId: '',
  map: null,
  nodes: [],
  edges: [],
  groups: [],
  chapters: [],
  acts: [],
  allScenes: [],
  allCharacters: [],
  allThreads: [],
  allLocations: [],

  selectedNodeIds: [],
  inspectedScene: null,
  snapToGrid: true,
  sequenceTrayOpen: false,
  chaptersPanelOpen: false,
  scenesDrawerOpen: false,
  gapHintsOpen: false,

  filter: {
    actId: 'all',
    chapterId: 'all',
    threadId: 'all',
    characterId: 'all',
  },

  saveStatus: 'idle',
  validationError: null,
  gapHints: [],

  past: [],
  future: [],

  initialize: ({
    map,
    nodes,
    edges,
    groups,
    chapters,
    acts,
    allScenes,
    allCharacters,
    allThreads,
    allLocations,
  }) => {
    const hintNodes = nodes.map((n) => ({
      id: n.data.nodeId,
      title: n.data.title,
      sequenceIndex: n.data.sequenceIndex,
      chapterId: n.data.chapterId,
    }));
    const hintEdges = edges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));
    const hints = evaluateGapHints(hintNodes, hintEdges, chapters);

    // Derive sequence order from existing sequence edges if present
    const nodeIds = nodes.map((n) => n.id);
    const derivationInput = edges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));
    const derivationResult = deriveSequence(nodeIds, derivationInput);

    const initializedNodes = derivationResult.isValid
      ? nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            sequenceIndex:
              derivationResult.sequenceIndices[n.id] !== undefined
                ? derivationResult.sequenceIndices[n.id]
                : n.data.sequenceIndex,
          },
        }))
      : nodes;

    set({
      mapId: map.id,
      projectId: map.projectId,
      map,
      nodes: initializedNodes,
      edges,
      groups,
      chapters,
      acts,
      allScenes,
      allCharacters,
      allThreads,
      allLocations,
      gapHints: hints,
      past: [],
      future: [],
    });
  },

  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges<Node<SceneNodeData>>(changes, state.nodes);
      return { nodes: nextNodes };
    });
    get().triggerSavePositions();
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const nextEdges = applyEdgeChanges<Edge<StoryEdgeData>>(changes, state.edges);
      return { edges: nextEdges };
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  connectEdge: (connection) => {
    const { nodes, edges, past } = get();
    if (!connection.source || !connection.target) return { success: false };

    // New edge candidate
    const candidateEdge: Edge<StoryEdgeData> = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'storyEdge',
      data: {
        edgeId: '',
        edgeType: 'sequence',
        label: null,
      },
    };

    const candidateEdges = [...edges, candidateEdge];
    const nodeIds = nodes.map((n) => n.id);
    const derivationInput = candidateEdges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));

    const result = deriveSequence(nodeIds, derivationInput);
    if (!result.isValid) {
      set({ validationError: result.error || 'Invalid sequence edge' });
      return { success: false, error: result.error };
    }

    // Save snapshot to history
    const newPast = [...past.slice(-29), { nodes, edges }];

    // Update sequence indices in nodes
    const updatedNodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        sequenceIndex: result.sequenceIndices[n.id] ?? null,
      },
    }));

    // Re-evaluate gap hints
    const hintNodes = updatedNodes.map((n) => ({
      id: n.data.nodeId,
      title: n.data.title,
      sequenceIndex: n.data.sequenceIndex,
      chapterId: n.data.chapterId,
    }));
    const hints = evaluateGapHints(hintNodes, derivationInput, get().chapters);

    set({
      nodes: updatedNodes,
      edges: candidateEdges,
      past: newPast,
      future: [],
      validationError: null,
      gapHints: hints,
    });

    return { success: true };
  },

  removeEdge: (edgeId) => {
    const { nodes, edges, past } = get();
    const newPast = [...past.slice(-29), { nodes, edges }];
    const nextEdges = edges.filter((e) => e.id !== edgeId);

    const nodeIds = nodes.map((n) => n.id);
    const derivationInput = nextEdges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));
    const result = deriveSequence(nodeIds, derivationInput);

    const updatedNodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        sequenceIndex: result.isValid ? result.sequenceIndices[n.id] ?? null : n.data.sequenceIndex,
      },
    }));

    const hintNodes = updatedNodes.map((n) => ({
      id: n.data.nodeId,
      title: n.data.title,
      sequenceIndex: n.data.sequenceIndex,
      chapterId: n.data.chapterId,
    }));
    const hints = evaluateGapHints(hintNodes, derivationInput, get().chapters);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      past: newPast,
      future: [],
      gapHints: hints,
    });
  },

  updateEdgeType: (edgeId, edgeType) => {
    const { edges, nodes, past } = get();
    const newPast = [...past.slice(-29), { nodes, edges }];

    const nextEdges = edges.map((e) => {
      if (e.id === edgeId) {
        return {
          ...e,
          data: {
            ...e.data,
            edgeType,
            edgeId: e.data?.edgeId || '',
            label: e.data?.label || null,
          },
        };
      }
      return e;
    });

    const nodeIds = nodes.map((n) => n.id);
    const derivationInput = nextEdges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));
    const result = deriveSequence(nodeIds, derivationInput);

    const updatedNodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        sequenceIndex: result.isValid ? result.sequenceIndices[n.id] ?? null : n.data.sequenceIndex,
      },
    }));

    set({
      edges: nextEdges,
      nodes: updatedNodes,
      past: newPast,
      future: [],
    });
  },

  updateEdgeLabel: (edgeId, label) => {
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...e.data,
                edgeId: e.data?.edgeId || '',
                edgeType: e.data?.edgeType || 'sequence',
                label,
              },
            }
          : e
      ),
    }));
  },

  addPlacedNode: (node) => {
    const { nodes, past } = get();
    const newPast = [...past.slice(-29), { nodes, edges: get().edges }];
    set({
      nodes: [...nodes, node],
      past: newPast,
      future: [],
    });
    get().triggerSavePositions();
  },

  removeNode: (nodeId) => {
    const { nodes, edges, past } = get();
    const newPast = [...past.slice(-29), { nodes, edges }];

    const nextNodes = nodes.filter((n) => n.id !== nodeId);
    const nextEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    const nodeIds = nextNodes.map((n) => n.id);
    const derivationInput = nextEdges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      edgeType: e.data?.edgeType || 'sequence',
    }));
    const result = deriveSequence(nodeIds, derivationInput);

    const updatedNodes = nextNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        sequenceIndex: result.isValid ? result.sequenceIndices[n.id] ?? null : n.data.sequenceIndex,
      },
    }));

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      past: newPast,
      future: [],
    });
  },

  reorderSequence: (newOrderedNodeIds) => {
    const { nodes, edges, past } = get();
    const newPast = [...past.slice(-29), { nodes, edges }];

    const { newEdges, sequenceMap } = rewireSequenceOrder(newOrderedNodeIds);

    // Keep annotation edges
    const nonSequenceEdges = edges.filter((e) => e.data?.edgeType !== 'sequence');
    const recreatedEdges: Edge<StoryEdgeData>[] = newEdges.map((ne) => ({
      id: `edge-${ne.sourceNodeId}-${ne.targetNodeId}`,
      source: ne.sourceNodeId,
      target: ne.targetNodeId,
      type: 'storyEdge',
      data: {
        edgeId: '',
        edgeType: 'sequence',
        label: null,
      },
    }));

    const nextEdges = [...nonSequenceEdges, ...recreatedEdges];

    const updatedNodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        sequenceIndex: sequenceMap[n.id] !== undefined ? sequenceMap[n.id] : null,
      },
    }));

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      past: newPast,
      future: [],
    });
  },

  autoArrange: () => {
    const { nodes, edges, past } = get();
    if (nodes.length === 0) {
      toast({
        title: 'Canvas is empty',
        description: 'Add or place scenes on the map first.',
      });
      return;
    }

    const newPast = [...past.slice(-29), { nodes, edges }];

    // Separate ordered from unplaced
    const orderedNodes = nodes
      .filter((n) => n.data.sequenceIndex !== null)
      .sort((a, b) => (a.data.sequenceIndex ?? 0) - (b.data.sequenceIndex ?? 0));

    const unplacedNodes = nodes
      .filter((n) => n.data.sequenceIndex === null)
      .sort((a, b) => {
        const chA = a.data.chapter?.orderIndex ?? 999;
        const chB = b.data.chapter?.orderIndex ?? 999;
        if (chA !== chB) return chA - chB;
        return (a.data.title || '').localeCompare(b.data.title || '');
      });

    const orderedIds = orderedNodes.map((n) => n.id);
    const unplacedIds = unplacedNodes.map((n) => n.id);

    const newPositions = calculateAutoArrangeLayout(orderedIds, unplacedIds);

    const arrangedNodes = nodes.map((n) => {
      const pos = newPositions[n.id];
      if (pos) {
        return {
          ...n,
          position: pos,
        };
      }
      return n;
    });

    set({
      nodes: arrangedNodes,
      past: newPast,
      future: [],
    });

    get().triggerSavePositions();

    toast({
      title: 'Canvas auto-arranged',
      description: `Arranged ${nodes.length} scene${nodes.length === 1 ? '' : 's'} in clean sequence layout.`,
    });
  },

  updateSceneData: (sceneId, updates) => {
    set((state) => {
      const updatedAllScenes = state.allScenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s
      );

      const updatedNodes = state.nodes.map((node) => {
        if (node.data.sceneId !== sceneId) return node;

        const nextData: SceneNodeData = {
          ...node.data,
          title: updates.title ?? node.data.title,
          description: updates.description !== undefined ? updates.description : node.data.description,
          status: updates.status ?? node.data.status,
          sceneType: updates.sceneType !== undefined ? updates.sceneType : node.data.sceneType,
          actId: updates.actId !== undefined ? updates.actId : node.data.actId,
          act: updates.act !== undefined ? updates.act : (updates.actId ? state.acts.find((a) => a.id === updates.actId) || null : node.data.act),
          chapterId: updates.chapterId !== undefined ? updates.chapterId : node.data.chapterId,
          chapter: updates.chapter !== undefined ? updates.chapter : (updates.chapterId ? state.chapters.find((c) => c.id === updates.chapterId) || null : node.data.chapter),
          characters: updates.characters !== undefined ? updates.characters : node.data.characters,
          threads: updates.threads !== undefined ? updates.threads : node.data.threads,
          location: updates.location !== undefined ? updates.location : node.data.location,
          timeLabel: updates.timeLabel !== undefined ? updates.timeLabel : node.data.timeLabel,
          color: updates.color !== undefined ? updates.color : node.data.color,
        };

        return {
          ...node,
          data: nextData,
        };
      });

      const updatedInspected =
        state.inspectedScene?.id === sceneId
          ? { ...state.inspectedScene, ...updates }
          : state.inspectedScene;

      return {
        allScenes: updatedAllScenes,
        nodes: updatedNodes,
        inspectedScene: updatedInspected,
      };
    });
  },

  deleteSceneFromStore: (sceneId) => {
    const { nodes, removeNode, setInspectedScene, inspectedScene } = get();
    const nodeToRemove = nodes.find((n) => n.data.sceneId === sceneId);
    if (nodeToRemove) {
      removeNode(nodeToRemove.id);
    }
    if (inspectedScene?.id === sceneId) {
      setInspectedScene(null);
    }
    set((state) => ({
      allScenes: state.allScenes.filter((s) => s.id !== sceneId),
    }));
  },

  setFilter: (newFilter) => {
    set((state) => {
      const merged = { ...state.filter, ...newFilter };
      const updatedNodes = state.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDimmed: computeDimmed(n, merged),
        },
      }));
      return { filter: merged, nodes: updatedNodes };
    });
  },

  resetFilter: () => {
    set((state) => {
      const reset = {
        actId: 'all' as const,
        chapterId: 'all' as const,
        threadId: 'all' as const,
        characterId: 'all' as const,
      };
      const updatedNodes = state.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDimmed: false,
        },
      }));
      return { filter: reset, nodes: updatedNodes };
    });
  },

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setSequenceTrayOpen: (open) => set({ sequenceTrayOpen: open }),
  setChaptersPanelOpen: (open) => set({ chaptersPanelOpen: open }),
  setScenesDrawerOpen: (open) => set({ scenesDrawerOpen: open }),
  setGapHintsOpen: (open) => set({ gapHintsOpen: open }),
  setInspectedScene: (scene) => set({ inspectedScene: scene }),
  clearValidationError: () => set({ validationError: null }),

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [{ nodes, edges }, ...future.slice(0, 29)];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: newFuture,
    });
    get().triggerSavePositions();
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past.slice(-29), { nodes, edges }];

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: newPast,
      future: newFuture,
    });
    get().triggerSavePositions();
  },

  triggerSavePositions: () => {
    set({ saveStatus: 'saving' });
    if (positionDebounceTimer) {
      clearTimeout(positionDebounceTimer);
    }

    positionDebounceTimer = setTimeout(async () => {
      const { mapId, nodes } = get();
      if (!mapId || nodes.length === 0) {
        set({ saveStatus: 'idle' });
        return;
      }

      const updates = nodes.map((n) => ({
        id: n.data.nodeId,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }));

      try {
        await batchUpdateNodePositionsAction(mapId, { updates });
        set({ saveStatus: 'saved' });
        setTimeout(() => {
          if (get().saveStatus === 'saved') {
            set({ saveStatus: 'idle' });
          }
        }, 2000);
      } catch {
        set({ saveStatus: 'error' });
      }
    }, 1000);
  },
}));
