'use client';

import * as React from 'react';
import { useStoryMapStore } from '@/stores/story-map-store';
import { addSceneToMapAction } from '@/app/actions/maps';
import { Search, Plus, Check, X, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { STATUS_VARIANTS } from '@/components/scenes/SceneCard';
import { cn } from '@/lib/utils';

export function ScenesDrawer() {
  const {
    mapId,
    allScenes,
    nodes,
    scenesDrawerOpen,
    setScenesDrawerOpen,
    addPlacedNode,
    setInspectedScene,
  } = useStoryMapStore();

  const [search, setSearch] = React.useState('');

  if (!scenesDrawerOpen) return null;

  const placedSceneIds = new Set(nodes.map((n) => n.data.sceneId));

  const filteredScenes = allScenes.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return s.title.toLowerCase().includes(term) || (s.description && s.description.toLowerCase().includes(term));
  });

  const handlePlaceScene = async (sceneId: string) => {
    const scene = allScenes.find((s) => s.id === sceneId);
    if (!scene) return;

    // Place at center / offset
    const res = await addSceneToMapAction(mapId, { sceneId, x: 120, y: 140 });
    if (res.success && res.data) {
      addPlacedNode({
        id: res.data.id,
        type: 'sceneNode',
        position: { x: res.data.x, y: res.data.y },
        data: {
          nodeId: res.data.id,
          sceneId: scene.id,
          sequenceIndex: res.data.sequenceIndex,
          title: scene.title,
          description: scene.description,
          status: scene.status,
          sceneType: scene.sceneType,
          actId: scene.actId,
          act: scene.act,
          chapterId: scene.chapterId,
          chapter: scene.chapter,
          characters: scene.characters,
          threads: scene.threads,
          location: scene.location,
          timeLabel: scene.timeLabel,
          color: scene.color,
          isDimmed: false,
        },
      });
    }
  };

  return (
    <div className="fixed top-14 right-4 z-30 flex h-[calc(100vh-5rem)] w-80 flex-col rounded-md border border-line bg-surface/95 shadow-md backdrop-blur-md">
      {/* Drawer Header */}
      <div className="flex h-11 items-center justify-between border-b border-line px-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
          <Film className="h-4 w-4 text-brand" />
          Project Scenes ({allScenes.length})
        </div>

        <button
          type="button"
          onClick={() => setScenesDrawerOpen(false)}
          className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-surface-sunken"
          title="Close drawer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-line/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
          <input
            type="text"
            placeholder="Filter project scenes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-line bg-surface-sunken pl-8 pr-3 py-1 text-xs text-ink outline-none"
          />
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {filteredScenes.length === 0 ? (
          <div className="p-4 text-center text-ink-soft">No matching scenes found.</div>
        ) : (
          filteredScenes.map((scene) => {
            const isPlaced = placedSceneIds.has(scene.id);
            const statusVariant = STATUS_VARIANTS[scene.status] || 'teal';

            return (
              <div
                key={scene.id}
                className={cn(
                  'flex flex-col justify-between rounded-md border border-line bg-surface p-2.5 shadow-2xs transition-colors',
                  isPlaced && 'bg-surface-sunken/40 border-line/80'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <Chip variant={statusVariant} size="sm">
                      {scene.status}
                    </Chip>

                    {isPlaced ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
                        <Check className="h-3 w-3" /> Placed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePlaceScene(scene.id)}
                        className="h-6 px-2 text-[11px] gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add to Map
                      </Button>
                    )}
                  </div>

                  <h5
                    onClick={() => setInspectedScene(scene)}
                    className="font-semibold text-ink line-clamp-1 hover:underline cursor-pointer"
                  >
                    {scene.title}
                  </h5>

                  <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
                    {scene.description || <span className="italic text-ink-soft/60">No description.</span>}
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
