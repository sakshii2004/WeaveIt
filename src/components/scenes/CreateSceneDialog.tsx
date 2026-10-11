'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSceneAction } from '@/app/actions/scenes';
import { createLocationAction, createChapterAction } from '@/app/actions/structure';
import { CharacterJoinSelector, type CharacterJoinItem } from './CharacterJoinSelector';
import { ThreadJoinSelector } from './ThreadJoinSelector';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { FieldInfo } from '@/components/ui/tooltip';
import {
  Loader2,
  Plus,
  BookOpen,
  Target,
  Layers,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  AlertCircle,
  Type,
} from 'lucide-react';
import type { SceneWithDetails } from '@/db/queries/scenes';
import type { Act, Chapter, Location, Character, Thread } from '@/db/schema';
import { SCENE_TYPE_OPTIONS, STATUS_OPTIONS } from './SceneDetailDrawer';
import type { SceneStatus, SceneType } from '@/lib/validators/scenes';

export type SceneFontSize = '14' | '16' | '17.5' | '20' | '24';

export const FONT_SIZE_MAP: Record<SceneFontSize, { label: string; className: string; description: string }> = {
  '14': { label: '14px', className: 'text-[14px] leading-relaxed', description: 'Compact' },
  '16': { label: '16px', className: 'text-[16px] leading-relaxed', description: 'Standard' },
  '17.5': { label: '17.5px', className: 'text-[17.5px] leading-[1.75]', description: 'Default Serif' },
  '20': { label: '20px', className: 'text-[20px] leading-[1.8]', description: 'Large' },
  '24': { label: '24px', className: 'text-[24px] leading-[1.85]', description: 'Expansive' },
};

export interface CreateSceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  acts: Act[];
  chapters?: Chapter[];
  locations?: Location[];
  characters?: Character[];
  threads?: Thread[];
  onSceneCreated?: (scene: SceneWithDetails, openInspector?: boolean) => void;
  onStructureRefreshed?: () => void;
}

export function CreateSceneDialog({
  open,
  onOpenChange,
  projectId,
  acts = [],
  chapters = [],
  locations = [],
  characters = [],
  threads = [],
  onSceneCreated,
  onStructureRefreshed,
}: CreateSceneDialogProps) {
  // Form Fields
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [actId, setActId] = React.useState<string>('');
  const [chapterId, setChapterId] = React.useState<string>('');
  const [locationId, setLocationId] = React.useState<string>('');
  const [sceneType, setSceneType] = React.useState<SceneType | ''>('');
  const [status, setStatus] = React.useState<SceneStatus>('seed');
  const [timeLabel, setTimeLabel] = React.useState('');
  const [selectedCharacters, setSelectedCharacters] = React.useState<CharacterJoinItem[]>([]);
  const [selectedThreadIds, setSelectedThreadIds] = React.useState<string[]>([]);

  // Font size preference state
  const [fontSize, setFontSize] = React.useState<SceneFontSize>(() => {
    if (typeof window === 'undefined') return '17.5';
    try {
      const saved = localStorage.getItem('weaveit_scene_editor_fontsize') as SceneFontSize | null;
      if (saved && FONT_SIZE_MAP[saved]) {
        return saved;
      }
    } catch {
      // Storage unavailable in restricted environment
    }
    return '17.5';
  });

  const handleFontSizeChange = (size: SceneFontSize) => {
    setFontSize(size);
    try {
      localStorage.setItem('weaveit_scene_editor_fontsize', size);
    } catch {
      // Storage unavailable
    }
  };

  // Inline creation states
  const [showAddLocation, setShowAddLocation] = React.useState(false);
  const [inlineLocName, setInlineLocName] = React.useState('');
  const [showAddChapter, setShowAddChapter] = React.useState(false);
  const [inlineChapterTitle, setInlineChapterTitle] = React.useState('');

  // UI States
  const [submittingAction, setSubmittingAction] = React.useState<'create' | 'create_open' | 'create_another' | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);

  const { toast } = useToast();

  // Reset form helper
  const resetForm = React.useCallback(() => {
    setTitle('');
    setDescription('');
    setPurpose('');
    setActId('');
    setChapterId('');
    setLocationId('');
    setSceneType('');
    setStatus('seed');
    setTimeLabel('');
    setSelectedCharacters([]);
    setSelectedThreadIds([]);
    setShowAddLocation(false);
    setInlineLocName('');
    setShowAddChapter(false);
    setInlineChapterTitle('');
    setConfirmDiscardOpen(false);
  }, []);

  const hasUnsavedChanges = React.useMemo(() => {
    return Boolean(
      title.trim() ||
      description.trim() ||
      purpose.trim() ||
      actId ||
      chapterId ||
      locationId ||
      selectedCharacters.length > 0 ||
      selectedThreadIds.length > 0
    );
  }, [title, description, purpose, actId, chapterId, locationId, selectedCharacters, selectedThreadIds]);

  // Request close handling
  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (hasUnsavedChanges) {
        setConfirmDiscardOpen(true);
        return;
      }
      resetForm();
      onOpenChange(false);
    } else {
      onOpenChange(true);
    }
  };

  const handleForceDiscard = () => {
    resetForm();
    onOpenChange(false);
  };

  // Inline Chapter creation
  const handleCreateInlineChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineChapterTitle.trim()) return;
    const res = await createChapterAction(projectId, { title: inlineChapterTitle.trim() });
    if (res.success && res.data) {
      setChapterId(res.data.id);
      setInlineChapterTitle('');
      setShowAddChapter(false);
      onStructureRefreshed?.();
      toast({ title: 'Chapter created', description: `Assigned to "${res.data.title}"` });
    }
  };

  // Inline Location creation
  const handleCreateInlineLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLocName.trim()) return;
    const res = await createLocationAction(projectId, { name: inlineLocName.trim() });
    if (res.success && res.data) {
      setLocationId(res.data.id);
      setInlineLocName('');
      setShowAddLocation(false);
      onStructureRefreshed?.();
      toast({ title: 'Location added', description: `Assigned to "${res.data.name}"` });
    }
  };

  // Submit Handler
  const handleExecuteCreate = async (actionType: 'create' | 'create_open' | 'create_another') => {
    if (!title.trim() && !description.trim()) {
      toast({
        title: 'Story input needed',
        description: 'Provide a title or write a quick scene fragment to create this scene.',
        variant: 'error',
      });
      return;
    }

    setSubmittingAction(actionType);
    try {
      const res = await createSceneAction(projectId, {
        title: title.trim() || undefined,
        description: description.trim() || null,
        purpose: purpose.trim() || null,
        actId: actId || null,
        chapterId: chapterId || null,
        locationId: locationId || null,
        sceneType: sceneType.trim() || null,
        status,
        timeLabel: timeLabel.trim() || null,
        characters: selectedCharacters.map((c) => ({
          characterId: c.characterId,
          roleInScene: c.roleInScene || null,
        })),
        threadIds: selectedThreadIds,
      });

      if (res.success && res.data) {
        toast({
          title: 'Scene created',
          description: `"${res.data.title}" has been anchored to your story.`,
          variant: 'success',
        });

        const createdScene = res.data;

        if (actionType === 'create_another') {
          // Keep dialog open, preserve Act/Chapter context for fast sequence drafting, clear scene content
          setTitle('');
          setDescription('');
          setPurpose('');
          setTimeLabel('');
          setSelectedCharacters([]);
          setSelectedThreadIds([]);
          onSceneCreated?.(createdScene, false);
        } else if (actionType === 'create_open') {
          resetForm();
          onOpenChange(false);
          onSceneCreated?.(createdScene, true);
        } else {
          resetForm();
          onOpenChange(false);
          onSceneCreated?.(createdScene, false);
        }
      } else {
        toast({
          title: 'Could not create scene',
          description: res.error || 'Failed to save scene. Please review your entries.',
          variant: 'error',
        });
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submittingAction) {
        handleExecuteCreate('create');
      }
    }
  };

  // Text stats
  const wordCount = React.useMemo(() => {
    const text = description.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [description]);

  const charCount = description.length;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleRequestClose}
        maxWidth="6xl"
        preventOutsideClick={hasUnsavedChanges}
      >
        <DialogContent
          onClose={() => handleRequestClose(false)}
          className="max-w-6xl w-full p-0 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl flex flex-col max-h-[92vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Studio Header */}
          <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-ink">New Story Scene</h2>
                  <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-ink-soft border border-line">
                    Widescreen Drafting Studio
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Capture a narrative beat, pivotal moment, or full prose draft with complete creative dignity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-8">
              {wordCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-ink-soft bg-surface-sunken px-2.5 py-1 rounded-md border border-line">
                  <BookOpen className="h-3.5 w-3.5 text-brand" /> {wordCount} words
                </span>
              )}
            </div>
          </div>

          {/* Studio Workspace: Dual-Pane Grid (Widescreen 8 / 4 distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-line">
            {/* Primary Creative Stream (Left 8 Cols for Maximum Writing Width) */}
            <div className="lg:col-span-8 p-6 sm:p-7 space-y-6 flex flex-col bg-surface overflow-y-auto">
              {/* Title Input */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    Scene Title
                  </label>
                  <FieldInfo content="Auto-derives from prose if omitted." />
                </div>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Elena encounters Marcus on the rain-swept bridge"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-ink placeholder:text-ink-soft/40 border-0 bg-transparent px-0 focus:ring-0 focus:border-0 shadow-none h-auto py-1"
                  autoFocus
                />
              </div>

              {/* True Writing Surface: Source Serif 4 Prose Canvas with Interactive Font Size Options */}
              <div className="space-y-2 flex flex-col flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-brand" /> Narrative Beats &amp; Details
                  </label>

                  <div className="flex items-center gap-3">
                    {/* Font Size Selector */}
                    <div className="flex items-center gap-0.5 bg-surface-sunken p-0.5 rounded-md border border-line text-ink-soft shadow-2xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1 text-ink-soft/70 flex items-center gap-1">
                        <Type className="h-3 w-3 text-brand" /> Font
                      </span>
                      {(['14', '16', '17.5', '20', '24'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleFontSizeChange(sz)}
                          className={cn(
                            'px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors',
                            fontSize === sz
                              ? 'bg-surface text-brand shadow-xs border border-line/80 font-bold'
                              : 'text-ink-soft hover:text-ink hover:bg-surface/50'
                          )}
                          title={`Font size ${FONT_SIZE_MAP[sz].label} (${FONT_SIZE_MAP[sz].description})`}
                        >
                          {sz === '17.5' ? '17.5' : sz}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] font-mono text-ink-soft/80 hidden sm:inline-block">
                      {wordCount} words · {charCount} chars
                    </span>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steam hisses across Platform 3. She notices the red seal on his envelope—the same insignia her grandfather wore. Before she can step back, he locks eyes with her..."
                  rows={12}
                  className={cn(
                    'w-full font-serif text-ink bg-surface-sunken/40 focus:bg-surface border border-line rounded-lg p-4 min-h-[280px] sm:min-h-[340px] focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all resize-y shadow-inner',
                    FONT_SIZE_MAP[fontSize].className
                  )}
                />

                <div className="flex items-center justify-between text-[11px] text-ink-soft/70">
                  <div className="flex items-center gap-1">
                    <span>Drafting notes</span>
                    <FieldInfo content="Tip: Write raw dialogue, atmosphere, or key story beats. Markdown supported." />
                  </div>
                  <span className="font-mono">{FONT_SIZE_MAP[fontSize].description} ({FONT_SIZE_MAP[fontSize].label})</span>
                </div>
              </div>

              {/* Scene Purpose & Conflict Card */}
              <div className="rounded-lg border border-line bg-surface-sunken/40 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Target className="h-4 w-4 text-brand" />
                  <span>Core Dramatic Purpose &amp; Value Shift</span>
                  <FieldInfo content="Why does this scene exist? What value shifts from start to finish? (e.g. trust to suspicion, danger to safety)." />
                </div>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Marcus confirms he knew the traitor. Elena shifts from cautious ally to active investigator."
                  rows={2}
                  className="w-full font-serif text-[15px] bg-surface border border-line rounded-md p-3 text-ink focus:border-brand focus:outline-none resize-none shadow-xs"
                />
              </div>
            </div>

            {/* Story Architecture Rail (Right 4 Cols) */}
            <div className="lg:col-span-4 p-5 sm:p-6 space-y-3 bg-surface-sunken/20 overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-line">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand" /> Story Architecture
                </h3>
                <FieldInfo content="Optional architectural anchors for your scene." />
              </div>

              {/* Act Placement */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Act Placement</label>
                <select
                  value={actId}
                  onChange={(e) => setActId(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none shadow-xs transition-colors"
                >
                  <option value="">Unassigned (Seed tray)</option>
                  {acts.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Chapter</label>
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(!showAddChapter)}
                    className="text-[11px] text-brand hover:underline"
                  >
                    {showAddChapter ? 'Cancel' : '+ New Chapter'}
                  </button>
                </div>
                {showAddChapter ? (
                  <form onSubmit={handleCreateInlineChapter} className="flex gap-1.5">
                    <Input
                      value={inlineChapterTitle}
                      onChange={(e) => setInlineChapterTitle(e.target.value)}
                      placeholder="Chapter title..."
                      className="h-8 text-xs bg-surface"
                      autoFocus
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-8 px-2.5 text-xs">
                      Add
                    </Button>
                  </form>
                ) : (
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none shadow-xs transition-colors"
                  >
                    <option value="">No Chapter</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Setting / Location */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-ink-soft" /> Setting / Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="text-[11px] text-brand hover:underline"
                  >
                    {showAddLocation ? 'Cancel' : '+ New Location'}
                  </button>
                </div>
                {showAddLocation ? (
                  <form onSubmit={handleCreateInlineLocation} className="flex gap-1.5">
                    <Input
                      value={inlineLocName}
                      onChange={(e) => setInlineLocName(e.target.value)}
                      placeholder="Location name..."
                      className="h-8 text-xs bg-surface"
                      autoFocus
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-8 px-2.5 text-xs">
                      Add
                    </Button>
                  </form>
                ) : (
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink focus:border-brand focus:outline-none shadow-xs transition-colors"
                  >
                    <option value="">None / Unspecified</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Time Anchor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-ink-soft" /> Time Anchor
                </label>
                <Input
                  type="text"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="e.g. Dawn, Day 3; Two days after the storm"
                  className="h-8 text-xs bg-surface"
                />
              </div>

              {/* Dramatic Function (Dedicated full-width row) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-brand" /> Dramatic Function
                  </label>
                  <span className="text-[11px] text-ink-soft/70">Optional</span>
                </div>
                <input
                  type="text"
                  list="create-scene-type-suggestions"
                  value={sceneType}
                  onChange={(e) => setSceneType(e.target.value)}
                  placeholder="e.g. Setup, Inciting Incident, Plot Twist, Climax..."
                  className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/50 focus:border-brand focus:outline-none shadow-xs transition-colors"
                />
                <datalist id="create-scene-type-suggestions">
                  {SCENE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.label} />
                  ))}
                </datalist>
              </div>

              {/* Maturity Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink">Maturity Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SceneStatus)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-brand focus:outline-none shadow-xs transition-colors"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cast Tagging */}
              <div className="space-y-1 pt-2 border-t border-line">
                <label className="text-xs font-semibold text-ink">Characters Present in Scene</label>
                <CharacterJoinSelector
                  allCharacters={characters}
                  selectedCharacters={selectedCharacters}
                  onChange={setSelectedCharacters}
                />
              </div>

              {/* Threads Tagging */}
              <div className="space-y-1.5 pt-2 border-t border-line">
                <label className="text-xs font-semibold text-ink">Plot &amp; Subplot Threads</label>
                <ThreadJoinSelector
                  allThreads={threads}
                  selectedThreadIds={selectedThreadIds}
                  onChange={setSelectedThreadIds}
                />
              </div>
            </div>
          </div>

          {/* Studio Footer: Flow Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line px-6 py-4 bg-surface shrink-0">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="hidden sm:inline-flex items-center gap-1">
                Press <kbd className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] font-mono text-ink">⌘ Enter</kbd> / <kbd className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] font-mono text-ink">Ctrl Enter</kbd> to save
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRequestClose(false)}
                disabled={Boolean(submittingAction)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleExecuteCreate('create_another')}
                disabled={(!title.trim() && !description.trim()) || Boolean(submittingAction)}
                className="text-xs gap-1.5"
                title="Create this scene and immediately start drafting the next scene"
              >
                {submittingAction === 'create_another' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create &amp; Add Another
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleExecuteCreate('create_open')}
                disabled={(!title.trim() && !description.trim()) || Boolean(submittingAction)}
                className="text-xs gap-1.5"
                title="Create scene and open Inspector Drawer for deep editing and screenplay Play"
              >
                {submittingAction === 'create_open' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                Create &amp; Open Inspector
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleExecuteCreate('create')}
                disabled={(!title.trim() && !description.trim()) || Boolean(submittingAction)}
                className="text-xs gap-1.5 px-4 shadow-sm"
              >
                {submittingAction === 'create' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create Scene
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Dialog (Prevents accidental loss of ideas) */}
      {confirmDiscardOpen && (
        <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen} maxWidth="sm">
          <DialogContent className="max-w-md p-6 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">Discard Scene Draft?</h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  You have uncommitted narrative text in this scene studio. If you close now, your draft will not be saved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDiscardOpen(false)}
                className="text-xs"
              >
                Keep Writing
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleForceDiscard}
                className="text-xs"
              >
                Discard Draft
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
