'use client';

import * as React from 'react';
import { ReactFlowProvider, type Node, type Edge } from '@xyflow/react';
import { useStoryMapStore, type SceneNodeData, type StoryEdgeData } from '@/stores/story-map-store';
import { MapHeaderBar } from './MapHeaderBar';
import { StoryMapCanvas } from './StoryMapCanvas';
import { SequenceTray } from './SequenceTray';
import { StoryMapRightPanel } from './StoryMapRightPanel';
import { SceneDetailDrawer } from '@/components/scenes/SceneDetailDrawer';
import { CreateSceneDialog } from '@/components/scenes/CreateSceneDialog';
import { addSceneToMapAction } from '@/app/actions/maps';
import type { StoryMap, Chapter, Act, Character, Thread, Location } from '@/db/schema';
import type { StoryMapDetails } from '@/db/queries/maps';
import type { SceneWithDetails } from '@/db/queries/scenes';

export interface StoryMapWorkspaceProps {
  initialDetails: StoryMapDetails;
  allMaps: StoryMap[];
  allScenes: SceneWithDetails[];
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  characters: Character[];
  threads: Thread[];
}

export function StoryMapWorkspace({
  initialDetails,
  allMaps,
  allScenes,
  acts,
  chapters,
  locations,
  characters,
  threads,
}: StoryMapWorkspaceProps) {
  const {
    initialize,
    inspectedScene,
    setInspectedScene,
    addPlacedNode,
    updateSceneData,
    deleteSceneFromStore,
  } = useStoryMapStore();

  const [createSceneOpen, setCreateSceneOpen] = React.useState(false);

  // Transform initial DB nodes to React Flow nodes
  const initializedMapIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (initializedMapIdRef.current === initialDetails.map.id) {
      return;
    }
    initializedMapIdRef.current = initialDetails.map.id;

    const flowNodes: Node<SceneNodeData>[] = initialDetails.nodes.map((n) => ({
      id: n.id,
      type: 'sceneNode',
      position: { x: n.x, y: n.y },
      data: {
        nodeId: n.id,
        sceneId: n.sceneId || '',
        sequenceIndex: n.sequenceIndex,
        title: n.scene?.title || 'Untitled Scene',
        description: n.scene?.description || null,
        status: n.scene?.status || 'seed',
        sceneType: n.scene?.sceneType || null,
        actId: n.scene?.actId || null,
        act: n.scene?.act || null,
        chapterId: n.scene?.chapterId || null,
        chapter: n.scene?.chapter || null,
        characters: n.scene?.characters || [],
        threads: n.scene?.threads || [],
        location: n.scene?.location || null,
        timeLabel: n.scene?.timeLabel || null,
        color: n.scene?.color || null,
        isDimmed: false,
      },
    }));

    const flowEdges: Edge<StoryEdgeData>[] = initialDetails.edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: 'storyEdge',
      data: {
        edgeId: e.id,
        edgeType: (e.edgeType as StoryEdgeData['edgeType']) || 'sequence',
        label: e.label,
      },
    }));

    initialize({
      map: initialDetails.map,
      nodes: flowNodes,
      edges: flowEdges,
      groups: initialDetails.groups,
      chapters,
      acts,
      allScenes,
      allCharacters: characters,
      allThreads: threads,
      allLocations: locations,
    });
  }, [initialDetails, acts, chapters, locations, characters, threads, allScenes, initialize]);

  const handleSceneCreated = async (newScene: SceneWithDetails) => {
    // Automatically place newly created scene on canvas
    const res = await addSceneToMapAction(initialDetails.map.id, {
      sceneId: newScene.id,
      x: 100,
      y: 100,
    });

    if (res.success && res.data) {
      addPlacedNode({
        id: res.data.id,
        type: 'sceneNode',
        position: { x: res.data.x, y: res.data.y },
        data: {
          nodeId: res.data.id,
          sceneId: newScene.id,
          sequenceIndex: res.data.sequenceIndex,
          title: newScene.title,
          description: newScene.description,
          status: newScene.status,
          sceneType: newScene.sceneType,
          actId: newScene.actId,
          act: newScene.act,
          chapterId: newScene.chapterId,
          chapter: newScene.chapter,
          characters: newScene.characters,
          threads: newScene.threads,
          location: newScene.location,
          timeLabel: newScene.timeLabel,
          color: newScene.color,
          isDimmed: false,
        },
      });
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
        {/* Top Header Bar for Map */}
        <MapHeaderBar
          allMaps={allMaps}
          onOpenCreateScene={() => setCreateSceneOpen(true)}
        />

        {/* Central React Flow Canvas & Docked Right Panel */}
        <div className="relative flex-1 w-full overflow-hidden">
          <StoryMapCanvas onOpenCreateScene={() => setCreateSceneOpen(true)} />
          <StoryMapRightPanel />
        </div>

        {/* Synced Sequence Tray */}
        <SequenceTray />

        {/* In-Place Scene Detail Inspector Drawer */}
        <SceneDetailDrawer
          open={Boolean(inspectedScene)}
          onOpenChange={(open) => {
            if (!open) setInspectedScene(null);
          }}
          scene={inspectedScene}
          projectId={initialDetails.map.projectId}
          acts={acts}
          chapters={chapters}
          locations={locations}
          allCharacters={characters}
          allThreads={threads}
          topOffset={true}
          onSceneUpdated={(updatedScene) => {
            updateSceneData(updatedScene.id, updatedScene);
          }}
          onSceneDeleted={(deletedSceneId) => {
            deleteSceneFromStore(deletedSceneId);
          }}
        />

        {/* Expansive Scene Creation Studio */}
        <CreateSceneDialog
          open={createSceneOpen}
          onOpenChange={setCreateSceneOpen}
          projectId={initialDetails.map.projectId}
          acts={acts}
          chapters={chapters}
          locations={locations}
          characters={characters}
          threads={threads}
          onSceneCreated={handleSceneCreated}
        />
      </div>
    </ReactFlowProvider>
  );
}
