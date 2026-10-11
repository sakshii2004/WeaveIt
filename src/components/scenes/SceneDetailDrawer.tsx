'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CharacterJoinSelector, type CharacterJoinItem } from './CharacterJoinSelector';
import { ThreadJoinSelector } from './ThreadJoinSelector';
import { updateSceneAction, softDeleteSceneAction } from '@/app/actions/scenes';
import { createLocationAction, createChapterAction } from '@/app/actions/structure';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { SceneStatus, SceneType } from '@/lib/validators/scenes';
import {
  Check,
  Loader2,
  Trash2,
  X,
  BookOpen,
  MapPin,
  Clock,
  Layers,
  Film,
  Plus,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FieldInfo } from '@/components/ui/tooltip';
import type { SceneWithDetails } from '@/db/queries/scenes';
import type { Character, Thread, Act, Chapter, Location } from '@/db/schema';
import { STORY_COLORS } from '@/components/structure/StructureManagementModal';
import { FONT_SIZE_MAP, type SceneFontSize } from './CreateSceneDialog';
import { PlayEditor } from '@/components/play/PlayEditor';

export const SCENE_TYPE_OPTIONS = [
  { value: 'setup', label: 'Setup' },
  { value: 'inciting', label: 'Inciting Incident' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'reveal', label: 'Key Reveal' },
  { value: 'twist', label: 'Plot Twist' },
  { value: 'turning_point', label: 'Turning Point' },
  { value: 'midpoint', label: 'Midpoint' },
  { value: 'climax', label: 'Climax' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'connective', label: 'Connective' },
  { value: 'other', label: 'Other' },
];

export const STATUS_OPTIONS = [
  { value: 'seed', label: 'Seed (Fragment)' },
  { value: 'sketched', label: 'Sketched' },
  { value: 'planned', label: 'Planned' },
  { value: 'played', label: 'Played' },
  { value: 'drafted', label: 'Drafted' },
];

interface SceneDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: SceneWithDetails | null;
  projectId: string;
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  allCharacters: Character[];
  allThreads: Thread[];
  topOffset?: boolean;
  initialTab?: TabKey;
  onSceneUpdated?: (updated: SceneWithDetails) => void;
  onSceneDeleted?: (id: string) => void;
  onStructureRefreshed?: () => void;
}

type TabKey = 'content' | 'cast_threads' | 'structure' | 'play';

export function SceneDetailDrawer({
  open,
  onOpenChange,
  scene,
  projectId,
  acts,
  chapters,
  locations,
  allCharacters,
  allThreads,
  topOffset = false,
  initialTab = 'content',
  onSceneUpdated,
  onSceneDeleted,
  onStructureRefreshed,
}: SceneDetailDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);
  const [isFocusMode, setIsFocusMode] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('weaveit_scene_inspector_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Storage unavailable
    }
    return true;
  });

  const handleToggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('weaveit_scene_inspector_expanded', String(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
  };
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Inline creation states
  const [showAddLocation, setShowAddLocation] = React.useState(false);
  const [inlineLocName, setInlineLocName] = React.useState('');
  const [showAddChapter, setShowAddChapter] = React.useState(false);
  const [inlineChapterTitle, setInlineChapterTitle] = React.useState('');

  // Font size preference state
  const [fontSize, setFontSize] = React.useState<SceneFontSize>(() => {
    if (typeof window === 'undefined') return '17.5';
    try {
      const saved = localStorage.getItem('weaveit_scene_editor_fontsize') as SceneFontSize | null;
      if (saved && FONT_SIZE_MAP[saved]) {
        return saved;
      }
    } catch {
      // Storage unavailable
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

  // Form State
  const [formData, setFormData] = React.useState({
    title: scene?.title ?? '',
    status: scene?.status ?? 'seed',
    description: scene?.description ?? '',
    sceneType: scene?.sceneType ?? '',
    purpose: scene?.purpose ?? '',
    locationId: scene?.locationId ?? '',
    chapterId: scene?.chapterId ?? '',
    actId: scene?.actId ?? '',
    timeLabel: scene?.timeLabel ?? '',
    color: scene?.color ?? '',
    characters: (scene?.characters || []).map((c) => ({
      characterId: c.character.id,
      roleInScene: c.roleInScene,
    })) as CharacterJoinItem[],
    threadIds: (scene?.threads || []).map((t) => t.id),
  });

  const [prevSceneId, setPrevSceneId] = React.useState<string | null>(scene?.id ?? null);

  if (scene && scene.id !== prevSceneId) {
    setPrevSceneId(scene.id);
    setFormData({
      title: scene.title ?? '',
      status: scene.status ?? 'seed',
      description: scene.description ?? '',
      sceneType: scene.sceneType ?? '',
      purpose: scene.purpose ?? '',
      locationId: scene.locationId ?? '',
      chapterId: scene.chapterId ?? '',
      actId: scene.actId ?? '',
      timeLabel: scene.timeLabel ?? '',
      color: scene.color ?? '',
      characters: (scene.characters || []).map((c) => ({
        characterId: c.character.id,
        roleInScene: c.roleInScene,
      })),
      threadIds: (scene.threads || []).map((t) => t.id),
    });
    setSaveStatus('idle');
  }

  // Prevent background scroll and listen to Esc
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Debounced Autosave
  const triggerAutosave = React.useCallback(
    (data: typeof formData) => {
      if (!scene) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus('saving');
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await updateSceneAction(scene.id, {
            title: data.title.trim() || scene.title,
            status: data.status as SceneStatus,
            description: data.description.trim() || null,
            sceneType: data.sceneType?.trim() || null,
            purpose: data.purpose.trim() || null,
            locationId: data.locationId || null,
            chapterId: data.chapterId || null,
            actId: data.actId || null,
            timeLabel: data.timeLabel.trim() || null,
            color: data.color || null,
            characters: data.characters,
            threadIds: data.threadIds,
          });

          if (res.success && res.data) {
            setSaveStatus('saved');
            onSceneUpdated?.(res.data);
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      }, 800);
    },
    [scene, onSceneUpdated]
  );

  const handleFieldChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    triggerAutosave(next);
  };

  const handleColorChange = (newColor: string) => {
    handleFieldChange('color', newColor);
    if (scene) {
      onSceneUpdated?.({ ...scene, color: newColor || null });
    }
  };

  const handleDelete = async () => {
    if (!scene) return;
    if (!window.confirm(`Delete scene "${scene.title}"?`)) return;

    setIsDeleting(true);
    const res = await softDeleteSceneAction(scene.id);
    setIsDeleting(false);

    if (res.success) {
      toast({
        title: 'Scene deleted',
        description: `"${scene.title}" moved to recently deleted.`,
      });
      onOpenChange(false);
      onSceneDeleted?.(scene.id);
    } else {
      toast({
        title: 'Delete failed',
        description: res.error || 'Could not delete scene',
        variant: 'error',
      });
    }
  };

  /* Inline Location Creation */
  const handleCreateInlineLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLocName.trim()) return;
    const res = await createLocationAction(projectId, { name: inlineLocName.trim() });
    if (res.success && res.data) {
      setInlineLocName('');
      setShowAddLocation(false);
      handleFieldChange('locationId', res.data.id);
      onStructureRefreshed?.();
      toast({ title: 'Location added and assigned' });
    }
  };

  /* Inline Chapter Creation */
  const handleCreateInlineChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineChapterTitle.trim()) return;
    const res = await createChapterAction(projectId, { title: inlineChapterTitle.trim() });
    if (res.success && res.data) {
      setInlineChapterTitle('');
      setShowAddChapter(false);
      handleFieldChange('chapterId', res.data.id);
      onStructureRefreshed?.();
      toast({ title: 'Chapter added and assigned' });
    }
  };

  if (!open || !scene) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end',
        topOffset && 'top-[6.25rem]'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-ink/20 backdrop-blur-xs transition-opacity duration-200',
          topOffset && 'top-[6.25rem]'
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Slide-over Inspector Drawer */}
      <div
        className={cn(
          'relative z-10 flex h-full w-full flex-col border-l border-line bg-surface shadow-2xl transition-all duration-200',
          isFocusMode ? 'max-w-5xl' : 'max-w-2xl'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-ink-soft bg-surface-sunken px-2 py-0.5 rounded border border-line">
              Scene Inspector
            </span>

            {/* Autosave Status Indicator */}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] text-ink-soft animate-in fade-in">
                <Loader2 className="h-3 w-3 animate-spin text-brand" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-story-mint-text bg-story-mint-bg px-2 py-0.5 rounded-sm animate-in fade-in">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-[11px] font-medium text-coral">Failed to save</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleFocusMode}
              className="text-ink-soft hover:text-ink"
              title={isFocusMode ? 'Dock to standard drawer' : 'Maximize / Focus Mode'}
            >
              {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-ink-soft hover:text-coral"
              title="Delete scene"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="text-ink-soft hover:text-ink"
              title="Close inspector (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title & Status Bar */}
        <div className="px-6 py-3 border-b border-line bg-surface space-y-3">
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Scene title..."
            className="text-lg font-bold tracking-tight text-ink border-0 bg-transparent px-0 focus:ring-0 focus:border-0 shadow-none"
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-soft">Status:</span>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs font-medium text-ink focus:border-brand focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-soft">Type:</span>
              <input
                type="text"
                list="scene-detail-type-suggestions"
                value={formData.sceneType}
                onChange={(e) => handleFieldChange('sceneType', e.target.value)}
                placeholder="Optional"
                className="w-24 sm:w-28 rounded-sm border border-line bg-surface-sunken px-2 py-1 text-xs text-ink placeholder:text-ink-soft/50 focus:border-brand focus:outline-none capitalize transition-colors"
              />
              <datalist id="scene-detail-type-suggestions">
                {SCENE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.label} />
                ))}
              </datalist>
            </div>

            {/* Quick Card Color Accent Selector */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-line">
              <span className="text-xs text-ink-soft">Color:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleColorChange('')}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border border-line text-ink-soft transition-colors',
                    !formData.color
                      ? 'bg-brand-soft text-brand-strong border-brand font-semibold'
                      : 'hover:bg-surface-sunken'
                  )}
                  title="Default canvas color"
                >
                  Auto
                </button>
                {STORY_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleColorChange(c.key)}
                    className={cn(
                      'h-4 w-4 rounded-full transition-transform hover:scale-110 cursor-pointer',
                      c.bgClass,
                      formData.color === c.key
                        ? 'ring-[1.5px] ring-brand ring-offset-1 ring-offset-surface'
                        : 'opacity-70 hover:opacity-100'
                    )}
                    title={c.label}
                  />
                ))}

                {/* Custom Color Swatch if active */}
                {formData.color && !STORY_COLORS.some((c) => c.key === formData.color) && (
                  <button
                    type="button"
                    onClick={() => handleColorChange(formData.color)}
                    style={{ backgroundColor: formData.color }}
                    className="h-4 w-4 rounded-full ring-[1.5px] ring-brand ring-offset-1 ring-offset-surface shadow-xs cursor-pointer"
                    title={`Custom color: ${formData.color}`}
                  />
                )}

                {/* Plus icon to pick ANY color from color picker */}
                <label
                  className="relative flex h-4 w-4 items-center justify-center rounded-full border border-line bg-surface-sunken hover:bg-surface hover:border-brand hover:text-brand text-ink-soft cursor-pointer transition-all hover:scale-110 shadow-2xs"
                  title="Pick custom color"
                >
                  <input
                    type="color"
                    value={formData.color?.startsWith('#') ? formData.color : '#0d9488'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Plus className="h-2.5 w-2.5 stroke-[2.5] pointer-events-none" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-line px-6 bg-surface-sunken/50 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Scene Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cast_threads')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cast_threads'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Cast &amp; Threads ({formData.characters.length + formData.threadIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'structure'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Structure &amp; Setting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('play')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'play'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-soft/70 hover:text-ink'
            }`}
          >
            <Film className="h-3 w-3" /> Play (Script)
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SCENE CONTENT (Writing Surfaces with Source Serif 4) */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Scene Description / Writing Surface */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-brand" /> Scene Description &amp; Prose Notes
                  </label>

                  {/* Font Size Selector */}
                  <div className="flex items-center gap-0.5 bg-surface-sunken p-0.5 rounded-md border border-line text-ink-soft">
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
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe what happens in this scene... Discover dialogue, gestures, realizations, and sensory fragments."
                  rows={8}
                  className={cn(
                    'w-full rounded-md border border-line bg-surface p-4 font-serif text-ink leading-relaxed placeholder:text-ink-soft/40 focus:border-brand focus:outline-none shadow-xs transition-all',
                    FONT_SIZE_MAP[fontSize].className
                  )}
                />
              </div>

              {/* Purpose / Transformation note */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-ink">
                    Purpose / What Changes Here?
                  </label>
                  <FieldInfo content="Reader realization &amp; stakes: What does the reader learn? How does the emotional charge or power balance shift?" />
                </div>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => handleFieldChange('purpose', e.target.value)}
                  placeholder="What does the reader learn? How does the emotional charge or power balance shift?"
                  rows={3}
                  className="w-full rounded-md border border-line bg-surface p-3 font-serif text-sm text-ink leading-relaxed placeholder:text-ink-soft/40 focus:border-brand focus:outline-none shadow-xs"
                />
              </div>

              {/* Time Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand" /> Story Time / Chronology Label
                </label>
                <Input
                  type="text"
                  value={formData.timeLabel}
                  onChange={(e) => handleFieldChange('timeLabel', e.target.value)}
                  placeholder="e.g. Day 1, Midnight; Two days after the funeral"
                  className="text-xs h-9"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CAST & THREADS */}
          {activeTab === 'cast_threads' && (
            <div className="space-y-6">
              <CharacterJoinSelector
                allCharacters={allCharacters}
                selectedCharacters={formData.characters}
                onChange={(updated) => handleFieldChange('characters', updated)}
              />

              <hr className="border-line" />

              <ThreadJoinSelector
                allThreads={allThreads}
                selectedThreadIds={formData.threadIds}
                onChange={(updated) => handleFieldChange('threadIds', updated)}
              />
            </div>
          )}

          {/* TAB 3: STRUCTURE & SETTING */}
          {activeTab === 'structure' && (
            <div className="space-y-6">
              {/* Act Assignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-brand" /> Act Placement
                </label>
                <select
                  value={formData.actId}
                  onChange={(e) => handleFieldChange('actId', e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {acts.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Assignment with inline create */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-brand" /> Chapter Assignment
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(!showAddChapter)}
                    className="text-[11px] text-brand hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" /> New Chapter
                  </button>
                </div>

                {showAddChapter && (
                  <form onSubmit={handleCreateInlineChapter} className="flex gap-2 p-2 rounded-sm bg-surface-sunken border border-line mb-2">
                    <Input
                      type="text"
                      value={inlineChapterTitle}
                      onChange={(e) => setInlineChapterTitle(e.target.value)}
                      placeholder="Chapter title..."
                      className="text-xs h-7 flex-1"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-7 text-xs">
                      Save
                    </Button>
                  </form>
                )}

                <select
                  value={formData.chapterId}
                  onChange={(e) => handleFieldChange('chapterId', e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Unassigned (No chapter)</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location with inline create */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand" /> Location / Setting
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="text-[11px] text-brand hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" /> New Location
                  </button>
                </div>

                {showAddLocation && (
                  <form onSubmit={handleCreateInlineLocation} className="flex gap-2 p-2 rounded-sm bg-surface-sunken border border-line mb-2">
                    <Input
                      type="text"
                      value={inlineLocName}
                      onChange={(e) => setInlineLocName(e.target.value)}
                      placeholder="Location name..."
                      className="text-xs h-7 flex-1"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-7 text-xs">
                      Save
                    </Button>
                  </form>
                )}

                <select
                  value={formData.locationId}
                  onChange={(e) => handleFieldChange('locationId', e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Scene Color Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Scene Color Accent
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('color', '')}
                    className={`px-2 py-1 text-xs rounded border border-line text-ink-soft ${
                      !formData.color ? 'bg-surface-sunken font-bold text-ink ring-2 ring-brand' : ''
                    }`}
                  >
                    Default
                  </button>
                  {STORY_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleFieldChange('color', c.key)}
                      className={`h-6 w-6 rounded-full ${c.bgClass} transition-transform ${
                        formData.color === c.key ? 'scale-125 ring-2 ring-brand' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}

                  {/* Custom Color Swatch if active */}
                  {formData.color && !STORY_COLORS.some((c) => c.key === formData.color) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('color', formData.color)}
                      style={{ backgroundColor: formData.color }}
                      className="h-6 w-6 rounded-full ring-2 ring-brand ring-offset-1 ring-offset-surface scale-125 shadow-xs cursor-pointer"
                      title={`Custom color: ${formData.color}`}
                    />
                  )}

                  {/* Plus icon to pick ANY color */}
                  <label
                    className="relative flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface-sunken hover:bg-surface hover:border-brand hover:text-brand text-ink-soft cursor-pointer transition-all hover:scale-110 shadow-2xs"
                    title="Pick custom color"
                  >
                    <input
                      type="color"
                      value={formData.color?.startsWith('#') ? formData.color : '#0d9488'}
                      onChange={(e) => handleFieldChange('color', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Plus className="h-3.5 w-3.5 stroke-[2.5] pointer-events-none" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLAY EDITOR (PRD §8.6, §7.3) */}
          {activeTab === 'play' && scene && (
            <PlayEditor
              scene={{
                ...scene,
                title: formData.title,
                status: (formData.status as SceneStatus) || scene.status,
                description: formData.description,
                purpose: formData.purpose,
              }}
              allCharacters={allCharacters}
              onStatusChange={(newStatus) => {
                setFormData((prev) => ({ ...prev, status: newStatus }));
                if (scene) {
                  onSceneUpdated?.({ ...scene, status: newStatus });
                }
              }}
              onPurposeChange={(newPurpose) => {
                setFormData((prev) => ({ ...prev, purpose: newPurpose }));
              }}
              onSceneUpdated={(updated) => {
                setFormData((prev) => ({
                  ...prev,
                  status: updated.status,
                  purpose: updated.purpose ?? prev.purpose,
                }));
                onSceneUpdated?.(updated);
              }}
              onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
              isFocusMode={isFocusMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
