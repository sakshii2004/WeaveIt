'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  createActAction,
  updateActAction,
  deleteActAction,
  createChapterAction,
  updateChapterAction,
  deleteChapterAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  createThreadAction,
  updateThreadAction,
  deleteThreadAction,
} from '@/app/actions/structure';
import { BookOpen, MapPin, GitCommit, Layers, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Act, Chapter, Location, Thread } from '@/db/schema';

export const STORY_COLORS = [
  { key: 'teal', label: 'Teal', bgClass: 'bg-story-teal-text' },
  { key: 'coral', label: 'Coral', bgClass: 'bg-story-coral-text' },
  { key: 'sun', label: 'Sun', bgClass: 'bg-story-sun-text' },
  { key: 'sky', label: 'Sky', bgClass: 'bg-story-sky-text' },
  { key: 'lavender', label: 'Lavender', bgClass: 'bg-story-lavender-text' },
  { key: 'mint', label: 'Mint', bgClass: 'bg-story-mint-text' },
  { key: 'rose', label: 'Rose', bgClass: 'bg-story-rose-text' },
  { key: 'slate', label: 'Slate', bgClass: 'bg-story-slate-text' },
] as const;

type StructureTab = 'acts' | 'chapters' | 'locations' | 'threads';

interface StructureManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  acts: Act[];
  chapters: Chapter[];
  locations: Location[];
  threads: Thread[];
  initialTab?: StructureTab;
  onStructureChanged?: () => void;
}

export function StructureManagementModal({
  open,
  onOpenChange,
  projectId,
  acts,
  chapters,
  locations,
  threads,
  initialTab = 'acts',
  onStructureChanged,
}: StructureManagementModalProps) {
  const [activeTab, setActiveTab] = React.useState<StructureTab>(initialTab);
  const [prevInitialTab, setPrevInitialTab] = React.useState(initialTab);
  const { toast } = useToast();

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // Form states
  const [loading, setLoading] = React.useState(false);

  // New item states
  const [newActName, setNewActName] = React.useState('');
  const [newActColor, setNewActColor] = React.useState<string>('teal');

  const [newChapterTitle, setNewChapterTitle] = React.useState('');

  const [newLocationName, setNewLocationName] = React.useState('');
  const [newLocationDesc, setNewLocationDesc] = React.useState('');

  const [newThreadName, setNewThreadName] = React.useState('');
  const [newThreadColor, setNewThreadColor] = React.useState<string>('teal');
  const [newThreadDesc, setNewThreadDesc] = React.useState('');

  // Edit item state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editColor, setEditColor] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');

  /* Handlers for Acts */
  const handleCreateAct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName.trim()) return;
    setLoading(true);
    const res = await createActAction(projectId, { name: newActName.trim(), color: newActColor });
    setLoading(false);
    if (res.success) {
      setNewActName('');
      toast({ title: 'Act created' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleUpdateAct = async (actId: string) => {
    setLoading(true);
    const res = await updateActAction(actId, { name: editTitle.trim(), color: editColor });
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      toast({ title: 'Act updated' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleDeleteAct = async (actId: string) => {
    setLoading(true);
    const res = await deleteActAction(actId);
    setLoading(false);
    if (res.success) {
      toast({ title: 'Act deleted' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  /* Handlers for Chapters */
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    setLoading(true);
    const res = await createChapterAction(projectId, { title: newChapterTitle.trim() });
    setLoading(false);
    if (res.success) {
      setNewChapterTitle('');
      toast({ title: 'Chapter created' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleUpdateChapter = async (chapterId: string) => {
    setLoading(true);
    const res = await updateChapterAction(chapterId, { title: editTitle.trim() });
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      toast({ title: 'Chapter updated' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    setLoading(true);
    const res = await deleteChapterAction(chapterId);
    setLoading(false);
    if (res.success) {
      toast({ title: 'Chapter deleted' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  /* Handlers for Locations */
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    setLoading(true);
    const res = await createLocationAction(projectId, {
      name: newLocationName.trim(),
      description: newLocationDesc.trim() || null,
    });
    setLoading(false);
    if (res.success) {
      setNewLocationName('');
      setNewLocationDesc('');
      toast({ title: 'Location added' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleUpdateLocation = async (locationId: string) => {
    setLoading(true);
    const res = await updateLocationAction(locationId, {
      name: editTitle.trim(),
      description: editDesc.trim() || null,
    });
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      toast({ title: 'Location updated' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    setLoading(true);
    const res = await deleteLocationAction(locationId);
    setLoading(false);
    if (res.success) {
      toast({ title: 'Location deleted' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  /* Handlers for Threads */
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadName.trim()) return;
    setLoading(true);
    const res = await createThreadAction(projectId, {
      name: newThreadName.trim(),
      color: newThreadColor,
      description: newThreadDesc.trim() || null,
    });
    setLoading(false);
    if (res.success) {
      setNewThreadName('');
      setNewThreadDesc('');
      toast({ title: 'Thread created' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleUpdateThread = async (threadId: string) => {
    setLoading(true);
    const res = await updateThreadAction(threadId, {
      name: editTitle.trim(),
      color: editColor,
      description: editDesc.trim() || null,
    });
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      toast({ title: 'Thread updated' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    setLoading(true);
    const res = await deleteThreadAction(threadId);
    setLoading(false);
    if (res.success) {
      toast({ title: 'Thread deleted' });
      onStructureChanged?.();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b border-line bg-surface">
          <DialogTitle className="text-xl font-bold text-ink">Story Structure &amp; Metadata</DialogTitle>
          <DialogDescription className="text-xs text-ink-soft">
            Organize the acts, chapters, locations, and thematic threads for this novel.
          </DialogDescription>

          {/* Sub tabs */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => { setActiveTab('acts'); setEditingId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'acts'
                  ? 'bg-brand text-white'
                  : 'bg-surface-sunken text-ink-soft hover:text-ink'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Acts ({acts.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('chapters'); setEditingId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'chapters'
                  ? 'bg-brand text-white'
                  : 'bg-surface-sunken text-ink-soft hover:text-ink'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Chapters ({chapters.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('locations'); setEditingId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'locations'
                  ? 'bg-brand text-white'
                  : 'bg-surface-sunken text-ink-soft hover:text-ink'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" /> Locations ({locations.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('threads'); setEditingId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'threads'
                  ? 'bg-brand text-white'
                  : 'bg-surface-sunken text-ink-soft hover:text-ink'
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" /> Threads ({threads.length})
            </button>
          </div>
        </DialogHeader>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 bg-surface-sunken/40">
          {/* ACTS TAB */}
          {activeTab === 'acts' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateAct} className="flex gap-2 items-center bg-surface p-3 rounded-md border border-line">
                <Input
                  type="text"
                  value={newActName}
                  onChange={(e) => setNewActName(e.target.value)}
                  placeholder="New Act name (e.g. Act IV: The Aftermath)"
                  className="text-xs h-9 flex-1"
                />
                <div className="flex items-center gap-1">
                  {STORY_COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewActColor(c.key)}
                      className={`h-5 w-5 rounded-full ${c.bgClass} transition-transform ${
                        newActColor === c.key ? 'scale-125 ring-2 ring-brand' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
                <Button type="submit" size="sm" disabled={!newActName.trim() || loading} className="h-9 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Act
                </Button>
              </form>

              <div className="space-y-2">
                {acts.map((act) => (
                  <div key={act.id} className="flex items-center justify-between bg-surface p-3 rounded-md border border-line text-xs">
                    {editingId === act.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-xs h-7 flex-1"
                        />
                        <div className="flex items-center gap-1">
                          {STORY_COLORS.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => setEditColor(c.key)}
                              className={`h-4 w-4 rounded-full ${c.bgClass} ${
                                editColor === c.key ? 'ring-2 ring-brand' : 'opacity-60'
                              }`}
                            />
                          ))}
                        </div>
                        <Button size="icon-sm" onClick={() => handleUpdateAct(act.id)} className="h-7 w-7">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)} className="h-7 w-7">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className={`h-3 w-3 rounded-full ${STORY_COLORS.find(c => c.key === act.color)?.bgClass || 'bg-brand'}`} />
                          <span className="font-semibold text-ink">{act.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingId(act.id);
                              setEditTitle(act.name);
                              setEditColor(act.color);
                            }}
                            className="h-7 w-7 text-ink-soft"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteAct(act.id)}
                            className="h-7 w-7 text-ink-soft hover:text-coral"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAPTERS TAB */}
          {activeTab === 'chapters' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateChapter} className="flex gap-2 items-center bg-surface p-3 rounded-md border border-line">
                <Input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="New Chapter title (e.g. Chapter 01: Departure)"
                  className="text-xs h-9 flex-1"
                />
                <Button type="submit" size="sm" disabled={!newChapterTitle.trim() || loading} className="h-9 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Chapter
                </Button>
              </form>

              <div className="space-y-2">
                {chapters.length === 0 ? (
                  <p className="p-4 text-center text-xs text-ink-soft bg-surface rounded-md border border-dashed border-line">
                    No chapters defined yet. Add chapter titles to group your story scenes.
                  </p>
                ) : (
                  chapters.map((ch, idx) => (
                    <div key={ch.id} className="flex items-center justify-between bg-surface p-3 rounded-md border border-line text-xs">
                      {editingId === ch.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-xs h-7 flex-1"
                          />
                          <Button size="icon-sm" onClick={() => handleUpdateChapter(ch.id)} className="h-7 w-7">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)} className="h-7 w-7">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-ink-soft text-[11px] font-semibold w-6">#{idx + 1}</span>
                            <span className="font-semibold text-ink">{ch.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingId(ch.id);
                                setEditTitle(ch.title);
                              }}
                              className="h-7 w-7 text-ink-soft"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="h-7 w-7 text-ink-soft hover:text-coral"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* LOCATIONS TAB */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateLocation} className="space-y-2 bg-surface p-3 rounded-md border border-line">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="Location name (e.g. Jaipur Railway Station)"
                    className="text-xs h-9 flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!newLocationName.trim() || loading} className="h-9 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Location
                  </Button>
                </div>
                <Input
                  type="text"
                  value={newLocationDesc}
                  onChange={(e) => setNewLocationDesc(e.target.value)}
                  placeholder="Optional brief atmosphere or description note"
                  className="text-xs h-8"
                />
              </form>

              <div className="space-y-2">
                {locations.length === 0 ? (
                  <p className="p-4 text-center text-xs text-ink-soft bg-surface rounded-md border border-dashed border-line">
                    No story locations recorded yet. Add settings where your scenes take place.
                  </p>
                ) : (
                  locations.map((loc) => (
                    <div key={loc.id} className="bg-surface p-3 rounded-md border border-line text-xs space-y-1">
                      {editingId === loc.id ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-xs h-7"
                          />
                          <Input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description note"
                            className="text-xs h-7"
                          />
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => handleUpdateLocation(loc.id)} className="h-6 text-xs">
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-6 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-brand" />
                              <span className="font-semibold text-ink">{loc.name}</span>
                            </div>
                            {loc.description && (
                              <p className="text-ink-soft text-[11px] pl-5">{loc.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingId(loc.id);
                                setEditTitle(loc.name);
                                setEditDesc(loc.description || '');
                              }}
                              className="h-7 w-7 text-ink-soft"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="h-7 w-7 text-ink-soft hover:text-coral"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* THREADS TAB */}
          {activeTab === 'threads' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateThread} className="space-y-2 bg-surface p-3 rounded-md border border-line">
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={newThreadName}
                    onChange={(e) => setNewThreadName(e.target.value)}
                    placeholder="Thread name (e.g. The Forged Will, Romance Arc)"
                    className="text-xs h-9 flex-1"
                  />
                  <div className="flex items-center gap-1">
                    {STORY_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setNewThreadColor(c.key)}
                        className={`h-5 w-5 rounded-full ${c.bgClass} transition-transform ${
                          newThreadColor === c.key ? 'scale-125 ring-2 ring-brand' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <Button type="submit" size="sm" disabled={!newThreadName.trim() || loading} className="h-9 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Thread
                  </Button>
                </div>
                <Input
                  type="text"
                  value={newThreadDesc}
                  onChange={(e) => setNewThreadDesc(e.target.value)}
                  placeholder="Optional brief description of this plot or character arc"
                  className="text-xs h-8"
                />
              </form>

              <div className="space-y-2">
                {threads.length === 0 ? (
                  <p className="p-4 text-center text-xs text-ink-soft bg-surface rounded-md border border-dashed border-line">
                    No plot threads defined yet. Create threads to track subplots and mystery clues across scenes.
                  </p>
                ) : (
                  threads.map((thread) => (
                    <div key={thread.id} className="bg-surface p-3 rounded-md border border-line text-xs space-y-1">
                      {editingId === thread.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <Input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="text-xs h-7 flex-1"
                            />
                            <div className="flex items-center gap-1">
                              {STORY_COLORS.map((c) => (
                                <button
                                  key={c.key}
                                  type="button"
                                  onClick={() => setEditColor(c.key)}
                                  className={`h-4 w-4 rounded-full ${c.bgClass} ${
                                    editColor === c.key ? 'ring-2 ring-brand' : 'opacity-60'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <Input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description"
                            className="text-xs h-7"
                          />
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => handleUpdateThread(thread.id)} className="h-6 text-xs">
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-6 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  STORY_COLORS.find(c => c.key === thread.color)?.bgClass || 'bg-brand'
                                }`}
                              />
                              <span className="font-semibold text-ink">{thread.name}</span>
                            </div>
                            {thread.description && (
                              <p className="text-ink-soft text-[11px] pl-4.5">{thread.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingId(thread.id);
                                setEditTitle(thread.name);
                                setEditColor(thread.color);
                                setEditDesc(thread.description || '');
                              }}
                              className="h-7 w-7 text-ink-soft"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteThread(thread.id)}
                              className="h-7 w-7 text-ink-soft hover:text-coral"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
