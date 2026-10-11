'use client';

import * as React from 'react';
import type { PlayBeat, BeatType } from '@/lib/validators/play';
import type { SceneWithDetails } from '@/db/queries/scenes';
import type { Character } from '@/db/schema';
import type { SceneStatus } from '@/lib/validators/scenes';
import { getScenePlayAction, saveScenePlayAction, updateSceneStatusAction } from '@/app/actions/play';
import { PlayBeatRow } from './PlayBeatRow';
import { PlayExportModal } from './PlayExportModal';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { STATUS_VARIANTS } from '@/components/scenes/SceneCard';
import {
  Check,
  Loader2,
  Film,
  Download,
  Maximize2,
  Minimize2,
  MessageSquare,
  Clapperboard,
  FileText,
  Compass,
  AlertCircle,
  HelpCircle,
  Target,
} from 'lucide-react';
import { FieldInfo } from '@/components/ui/tooltip';
import { v7 as uuidv7 } from 'uuid';

export interface PlayEditorProps {
  scene: SceneWithDetails;
  allCharacters: Character[];
  onStatusChange?: (newStatus: SceneStatus) => void;
  onPurposeChange?: (newPurpose: string) => void;
  onSceneUpdated?: (updated: SceneWithDetails) => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
}

export function PlayEditor({
  scene,
  allCharacters,
  onStatusChange,
  onPurposeChange,
  onSceneUpdated,
  onToggleFocusMode,
  isFocusMode = false,
}: PlayEditorProps) {
  const [beats, setBeats] = React.useState<PlayBeat[]>([]);
  const [purposeNote, setPurposeNote] = React.useState<string>(scene.purpose ?? '');
  const [loadedSceneId, setLoadedSceneId] = React.useState<string | null>(null);
  const isLoading = loadedSceneId !== scene.id;
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [focusBeatId, setFocusBeatId] = React.useState<string | null>(null);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = React.useRef(true);

  // Map of characters for lookup
  const characterMap = React.useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of allCharacters) {
      map.set(c.id, c);
    }
    return map;
  }, [allCharacters]);

  const sceneCharacterIds = React.useMemo(() => {
    return scene.characters.map((c) => c.character.id);
  }, [scene.characters]);

  // Load play data when scene.id changes
  React.useEffect(() => {
    let isCancelled = false;
    initialLoadRef.current = true;

    async function loadPlay() {
      try {
        const res = await getScenePlayAction(scene.id);
        if (!isCancelled) {
          if (res.success && res.data) {
            setBeats(res.data.content || []);
            setPurposeNote(res.data.purposeNote ?? scene.purpose ?? '');
          } else {
            setBeats([]);
            setPurposeNote(scene.purpose ?? '');
          }
        }
      } catch {
        if (!isCancelled) {
          setBeats([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadedSceneId(scene.id);
          // Wait a tick before allowing autosave on user typing
          setTimeout(() => {
            initialLoadRef.current = false;
          }, 300);
        }
      }
    }

    loadPlay();

    return () => {
      isCancelled = true;
    };
  }, [scene.id, scene.purpose]);

  // Debounced autosave (800ms) for beats & purposeNote
  const triggerAutosave = React.useCallback(
    (currentBeats: PlayBeat[], currentPurpose: string) => {
      if (initialLoadRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus('saving');
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await saveScenePlayAction(scene.id, {
            content: currentBeats,
            purposeNote: currentPurpose.trim() || null,
          });

          if (res.success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      }, 800);
    },
    [scene.id]
  );

  // Beat manipulation handlers
  const handleUpdateBeat = (updatedBeat: PlayBeat) => {
    setBeats((prev) => {
      const next = prev.map((b) => (b.id === updatedBeat.id ? updatedBeat : b));
      triggerAutosave(next, purposeNote);
      return next;
    });
  };

  const handleDeleteBeat = (id: string) => {
    setBeats((prev) => {
      const next = prev.filter((b) => b.id !== id);
      triggerAutosave(next, purposeNote);
      return next;
    });
  };

  const handleAddBeatAfter = (id: string, type: BeatType = 'action') => {
    const newBeat: PlayBeat = {
      id: uuidv7(),
      type,
      characterId: type === 'dialogue' && sceneCharacterIds.length > 0 ? sceneCharacterIds[0] : null,
      text: '',
    };

    setBeats((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      const next = [...prev];
      if (index === -1) {
        next.push(newBeat);
      } else {
        next.splice(index + 1, 0, newBeat);
      }
      triggerAutosave(next, purposeNote);
      return next;
    });

    setFocusBeatId(newBeat.id);
  };

  const handleAddBeatAtEnd = (type: BeatType) => {
    const newBeat: PlayBeat = {
      id: uuidv7(),
      type,
      characterId: type === 'dialogue' && sceneCharacterIds.length > 0 ? sceneCharacterIds[0] : null,
      text: '',
    };

    setBeats((prev) => {
      const next = [...prev, newBeat];
      triggerAutosave(next, purposeNote);
      return next;
    });

    setFocusBeatId(newBeat.id);
  };

  const handleMoveBeat = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= beats.length) return;

    setBeats((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      triggerAutosave(next, purposeNote);
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMoveBeat(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Purpose Note change
  const handlePurposeChange = (val: string) => {
    setPurposeNote(val);
    onPurposeChange?.(val);
    triggerAutosave(beats, val);
  };

  // Seed from scene description
  const handleSeedFromDescription = () => {
    if (!scene.description) return;
    const initialBeat: PlayBeat = {
      id: uuidv7(),
      type: 'action',
      characterId: null,
      text: scene.description,
    };
    const next = [initialBeat];
    setBeats(next);
    triggerAutosave(next, purposeNote);
  };

  // Manual status change per PRD §8.6
  const handleStatusChange = async (newStatus: SceneStatus) => {
    const res = await updateSceneStatusAction(scene.id, newStatus);
    if (res.success && res.data) {
      onStatusChange?.(newStatus);
      onSceneUpdated?.(res.data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-ink-soft">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
        <p className="text-xs font-mono">Loading scene script...</p>
      </div>
    );
  }

  const currentStatusVariant = STATUS_VARIANTS[scene.status] || 'teal';

  return (
    <div className="space-y-6">
      {/* Top Play Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        {/* Left: Status & Manual "Mark as Played" */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-ink-soft">Status:</span>
            <Chip variant={currentStatusVariant} size="sm">
              {scene.status.toUpperCase()}
            </Chip>
          </div>

          {scene.status !== 'played' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('played')}
              className="h-7 text-xs gap-1 border-brand/40 text-brand hover:bg-brand-soft"
              title="Manually advance scene progression to Played (PRD §8.6)"
            >
              <Check className="h-3 w-3" /> Mark as Played
            </Button>
          ) : (
            <span className="text-[11px] text-success font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Script Complete
            </span>
          )}

          {/* Quick status dropdown */}
          <select
            value={scene.status}
            onChange={(e) => handleStatusChange(e.target.value as SceneStatus)}
            className="rounded-sm border border-line bg-surface-sunken px-2 py-0.5 text-xs text-ink focus:border-brand focus:outline-none capitalize"
            title="Manual status transition"
          >
            <option value="seed">Seed</option>
            <option value="sketched">Sketched</option>
            <option value="planned">Planned</option>
            <option value="played">Played</option>
            <option value="drafted">Drafted</option>
          </select>
        </div>

        {/* Right: Autosave status, Focus Mode, Export */}
        <div className="flex items-center gap-2">
          {/* Quiet Autosave Indicator */}
          <div className="text-[11px] text-ink-soft flex items-center gap-1 px-2 py-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-ink-soft">
                <Loader2 className="h-3 w-3 animate-spin text-brand" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-coral">
                <AlertCircle className="h-3 w-3" /> Save failed
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-ink-soft/60">Autosave on</span>
            )}
          </div>

          {/* Export Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-7 text-xs gap-1.5"
            title="Export as screenplay plain text or markdown"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          {/* Focus Mode / Maximize Toggle */}
          {onToggleFocusMode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleFocusMode}
              className="h-7 w-7 p-0 text-ink-soft hover:text-ink"
              title={isFocusMode ? 'Restore standard view' : 'Maximize for distraction-free writing'}
            >
              {isFocusMode ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Purpose & Dramatic Shift Card (PRD §8.6) */}
      <div className="rounded-md border border-line bg-surface p-4 space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-brand" /> Scene Purpose &amp; Stakes
          </label>
          <FieldInfo content="What does the reader learn / what changes here?" />
        </div>
        <textarea
          value={purposeNote}
          onChange={(e) => handlePurposeChange(e.target.value)}
          placeholder="Articulate the core revelation, value shift, or dramatic consequence of this scene..."
          rows={2}
          className="w-full rounded-sm border border-line bg-surface-sunken p-2.5 font-serif text-xs text-ink placeholder:text-ink-soft/40 focus:border-brand focus:outline-none transition-colors leading-relaxed"
        />
      </div>

      {/* Screenplay Paper Canvas Container */}
      <div className="rounded-lg border border-line bg-surface shadow-xs p-4 sm:p-8 space-y-4">
        {/* Screenplay Header Slugline */}
        <div className="border-b border-line pb-3 flex items-center justify-between text-xs font-mono text-ink-soft select-none">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-brand" />
            <span className="font-bold uppercase tracking-wider text-ink">
              SCENE: {scene.title.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-ink-soft/70">
            {beats.length} {beats.length === 1 ? 'beat' : 'beats'}
          </span>
        </div>

        {/* Empty State / Quick Seed */}
        {beats.length === 0 && (
          <div className="rounded-md border border-dashed border-line bg-surface-sunken/40 p-8 text-center space-y-4">
            <Film className="h-8 w-8 text-brand mx-auto opacity-70" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">Start Scripting This Scene</h4>
              <p className="text-xs text-ink-soft max-w-sm mx-auto leading-relaxed">
                Discover the dialogue, gestures, and realizations beat-by-beat in authentic screenplay formatting.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {scene.description && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSeedFromDescription}
                  className="gap-1.5 text-xs border-brand/30 text-brand hover:bg-brand-soft"
                >
                  <FileText className="h-3.5 w-3.5" /> Seed from Scene Description
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleAddBeatAtEnd('dialogue')}
                className="gap-1.5 text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" /> + Dialogue Beat
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddBeatAtEnd('action')}
                className="gap-1.5 text-xs"
              >
                <Clapperboard className="h-3.5 w-3.5" /> + Action Beat
              </Button>
            </div>
          </div>
        )}

        {/* Beat Rows List */}
        {beats.length > 0 && (
          <div className="space-y-2">
            {beats.map((beat, idx) => (
              <PlayBeatRow
                key={beat.id}
                beat={beat}
                index={idx}
                totalBeats={beats.length}
                allCharacters={allCharacters}
                sceneCharacterIds={sceneCharacterIds}
                characterMap={characterMap}
                onUpdate={handleUpdateBeat}
                onDelete={handleDeleteBeat}
                onAddAfter={handleAddBeatAfter}
                onMove={handleMoveBeat}
                onFocusPrevious={(curr) => {
                  const prev = beats[curr - 1];
                  if (prev) setFocusBeatId(prev.id);
                }}
                draggedIndex={draggedIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                autoFocus={focusBeatId === beat.id}
              />
            ))}
          </div>
        )}

        {/* Bottom Quick-Add Actions & Keyboard Guide */}
        {beats.length > 0 && (
          <div className="pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            {/* Quick Add Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-ink-soft pr-1">+ Add:</span>
              <button
                type="button"
                onClick={() => handleAddBeatAtEnd('dialogue')}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-surface-sunken border border-line hover:border-brand hover:text-brand transition-colors"
              >
                <MessageSquare className="h-3 w-3" /> Dialogue
              </button>
              <button
                type="button"
                onClick={() => handleAddBeatAtEnd('action')}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-surface-sunken border border-line hover:border-brand hover:text-brand transition-colors"
              >
                <Clapperboard className="h-3 w-3" /> Action
              </button>
              <button
                type="button"
                onClick={() => handleAddBeatAtEnd('narrator_note')}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-surface-sunken border border-line hover:border-brand hover:text-brand transition-colors"
              >
                <FileText className="h-3 w-3" /> Note
              </button>
              <button
                type="button"
                onClick={() => handleAddBeatAtEnd('direction')}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-surface-sunken border border-line hover:border-brand hover:text-brand transition-colors"
              >
                <Compass className="h-3 w-3" /> Direction
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-[11px] text-ink-soft/70 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-brand" />
              <span>
                <kbd className="font-mono bg-surface-sunken px-1 rounded-xs border border-line">↵</kbd> next beat •{' '}
                <kbd className="font-mono bg-surface-sunken px-1 rounded-xs border border-line">/</kbd> or{' '}
                <kbd className="font-mono bg-surface-sunken px-1 rounded-xs border border-line">Tab</kbd> type •{' '}
                <kbd className="font-mono bg-surface-sunken px-1 rounded-xs border border-line">@</kbd> cast
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <PlayExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        beats={beats}
        characterMap={characterMap}
        sceneTitle={scene.title}
      />
    </div>
  );
}
