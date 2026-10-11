import { eq, and, isNull, isNotNull, desc, asc, inArray, or, ilike } from 'drizzle-orm';
import { db } from '../index';
import {
  scenes,
  sceneCharacters,
  sceneThreads,
  characters,
  threads,
  acts,
  chapters,
  locations,
  projects,
  type Scene,
  type NewScene,
  type Character,
  type Thread,
  type Act,
  type Chapter,
  type Location,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';
import { stubCharacters } from './characters';
import { stubActs, stubChapters, stubLocations, stubThreads } from './structure';

export interface SceneWithDetails extends Scene {
  characters: {
    character: Character;
    roleInScene: string | null;
  }[];
  threads: Thread[];
  act: Act | null;
  chapter: Chapter | null;
  location: Location | null;
}

export interface SceneFilters {
  status?: string | string[];
  actId?: string;
  chapterId?: string;
  threadId?: string;
  characterId?: string;
  search?: string;
  includeDeleted?: boolean;
}

// In-memory fallback stores for test/offline stub mode
export const stubScenes = new Map<string, Scene>();
export const stubSceneCharacters = new Map<string, { characterId: string; roleInScene: string | null }[]>();
export const stubSceneThreads = new Map<string, string[]>(); // sceneId -> threadId[]

import { stubScenePlays, clearPlayStubsForTesting } from './play';

export function clearSceneStubsForTesting() {
  stubScenes.clear();
  stubSceneCharacters.clear();
  stubSceneThreads.clear();
  clearPlayStubsForTesting();
}

/**
 * Derive title from description if title is omitted
 */
export function deriveTitleFromDescription(description?: string | null): string {
  if (!description || !description.trim()) {
    return 'Untitled Scene';
  }
  const clean = description.trim().split('\n')[0].trim();
  // Cut at first sentence end or max 8 words
  const sentenceEnd = clean.search(/[.?!]/);
  const firstSentence = sentenceEnd !== -1 ? clean.slice(0, sentenceEnd) : clean;
  const words = firstSentence.split(/\s+/).slice(0, 8).join(' ');
  return words.length > 80 ? words.slice(0, 77) + '...' : words;
}

export async function findSceneById(id: string): Promise<Scene | null> {
  if (db) {
    const result = await db.select().from(scenes).where(eq(scenes.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubScenes.get(id) ?? null;
}

export async function getSceneWithDetails(id: string): Promise<SceneWithDetails | null> {
  const scene = await findSceneById(id);
  if (!scene) return null;

  if (db) {
    // 1. Fetch character joins
    const charRows = await db
      .select({
        character: characters,
        roleInScene: sceneCharacters.roleInScene,
      })
      .from(sceneCharacters)
      .innerJoin(characters, eq(characters.id, sceneCharacters.characterId))
      .where(eq(sceneCharacters.sceneId, id));

    // 2. Fetch thread joins
    const threadRows = await db
      .select({
        thread: threads,
      })
      .from(sceneThreads)
      .innerJoin(threads, eq(threads.id, sceneThreads.threadId))
      .where(eq(sceneThreads.sceneId, id));

    // 3. Fetch Act, Chapter, Location if referenced
    let act: Act | null = null;
    if (scene.actId) {
      const actRes = await db.select().from(acts).where(eq(acts.id, scene.actId)).limit(1);
      act = actRes[0] ?? null;
    }

    let chapter: Chapter | null = null;
    if (scene.chapterId) {
      const chRes = await db.select().from(chapters).where(eq(chapters.id, scene.chapterId)).limit(1);
      chapter = chRes[0] ?? null;
    }

    let location: Location | null = null;
    if (scene.locationId) {
      const locRes = await db.select().from(locations).where(eq(locations.id, scene.locationId)).limit(1);
      location = locRes[0] ?? null;
    }

    return {
      ...scene,
      characters: charRows.map((r) => ({
        character: r.character,
        roleInScene: r.roleInScene,
      })),
      threads: threadRows.map((r) => r.thread),
      act,
      chapter,
      location,
    };
  }

  // Stub in-memory enrichment
  const joinedChars = (stubSceneCharacters.get(id) || []).map((sc) => {
    const char = findCharacterByIdSync(sc.characterId);
    return {
      character: char || {
        id: sc.characterId,
        projectId: scene.projectId,
        name: 'Unknown Character',
        imageUrl: null,
        role: 'supporting',
        roleCustom: null,
        description: null,
        personality: null,
        goals: null,
        fears: null,
        background: null,
        arc: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      roleInScene: sc.roleInScene,
    };
  });

  const threadIds = stubSceneThreads.get(id) || [];
  const joinedThreads = threadIds.map((tid) => findThreadByIdSync(tid)).filter(Boolean) as Thread[];

  const act = scene.actId ? findActByIdSync(scene.actId) : null;
  const chapter = scene.chapterId ? findChapterByIdSync(scene.chapterId) : null;
  const location = scene.locationId ? findLocationByIdSync(scene.locationId) : null;

  return {
    ...scene,
    characters: joinedChars,
    threads: joinedThreads,
    act,
    chapter,
    location,
  };
}

export async function listScenesByProject(
  projectId: string,
  filters?: SceneFilters
): Promise<SceneWithDetails[]> {
  if (db) {
    const conditions = [eq(scenes.projectId, projectId)];

    if (!filters?.includeDeleted) {
      conditions.push(isNull(scenes.deletedAt));
    }

    if (filters?.status) {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        conditions.push(inArray(scenes.status, filters.status));
      } else if (typeof filters.status === 'string' && filters.status !== 'all') {
        conditions.push(eq(scenes.status, filters.status));
      }
    }

    if (filters?.actId && filters.actId !== 'all') {
      conditions.push(eq(scenes.actId, filters.actId));
    }

    if (filters?.chapterId && filters.chapterId !== 'all') {
      conditions.push(eq(scenes.chapterId, filters.chapterId));
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          ilike(scenes.title, term),
          ilike(scenes.description, term),
          ilike(scenes.timeLabel, term),
          ilike(scenes.purpose, term)
        )!
      );
    }

    const sceneRows = await db
      .select()
      .from(scenes)
      .where(and(...conditions))
      .orderBy(asc(scenes.createdAt));

    // Enrich all matching scenes
    const enriched = await Promise.all(
      sceneRows.map(async (scene) => {
        return (await getSceneWithDetails(scene.id))!;
      })
    );

    // Filter by character or thread joins in-memory if requested
    let result = enriched.filter(Boolean);
    if (filters?.characterId && filters.characterId !== 'all') {
      result = result.filter((s) => s.characters.some((c) => c.character.id === filters.characterId));
    }
    if (filters?.threadId && filters.threadId !== 'all') {
      result = result.filter((s) => s.threads.some((t) => t.id === filters.threadId));
    }

    return result;
  }

  // Stub in-memory listing
  let list = Array.from(stubScenes.values()).filter((s) => s.projectId === projectId);

  if (!filters?.includeDeleted) {
    list = list.filter((s) => !s.deletedAt);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status) && filters.status.length > 0) {
      list = list.filter((s) => filters.status!.includes(s.status));
    } else if (typeof filters.status === 'string' && filters.status !== 'all') {
      list = list.filter((s) => s.status === filters.status);
    }
  }

  if (filters?.actId && filters.actId !== 'all') {
    list = list.filter((s) => s.actId === filters.actId);
  }

  if (filters?.chapterId && filters.chapterId !== 'all') {
    list = list.filter((s) => s.chapterId === filters.chapterId);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.timeLabel && s.timeLabel.toLowerCase().includes(q)) ||
        (s.purpose && s.purpose.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const enriched = await Promise.all(list.map((s) => getSceneWithDetails(s.id)));
  let result = enriched.filter(Boolean) as SceneWithDetails[];

  if (filters?.characterId && filters.characterId !== 'all') {
    result = result.filter((s) => s.characters.some((c) => c.character.id === filters.characterId));
  }
  if (filters?.threadId && filters.threadId !== 'all') {
    result = result.filter((s) => s.threads.some((t) => t.id === filters.threadId));
  }

  return result;
}

export async function listDeletedScenesByProject(projectId: string): Promise<Scene[]> {
  if (db) {
    return await db
      .select()
      .from(scenes)
      .where(and(eq(scenes.projectId, projectId), isNotNull(scenes.deletedAt)))
      .orderBy(desc(scenes.deletedAt));
  }
  return Array.from(stubScenes.values())
    .filter((s) => s.projectId === projectId && Boolean(s.deletedAt))
    .sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));
}

export async function createScene(data: {
  projectId: string;
  title?: string;
  description?: string | null;
  status?: string;
  sceneType?: string | null;
  purpose?: string | null;
  locationId?: string | null;
  chapterId?: string | null;
  actId?: string | null;
  timeLabel?: string | null;
  color?: string | null;
  characters?: { characterId: string; roleInScene?: string | null }[];
  threadIds?: string[];
}): Promise<SceneWithDetails> {
  const sceneId = uuidv7();
  const now = new Date();

  const finalTitle = data.title?.trim() || deriveTitleFromDescription(data.description);

  const record: Scene = {
    id: sceneId,
    projectId: data.projectId,
    title: finalTitle,
    status: data.status || 'seed',
    description: data.description?.trim() || null,
    sceneType: data.sceneType || null,
    purpose: data.purpose?.trim() || null,
    locationId: data.locationId || null,
    chapterId: data.chapterId || null,
    actId: data.actId || null,
    timeLabel: data.timeLabel?.trim() || null,
    color: data.color || null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(scenes).values(record).returning();

    // Insert character joins if provided
    if (data.characters && data.characters.length > 0) {
      await db.insert(sceneCharacters).values(
        data.characters.map((c) => ({
          sceneId: inserted.id,
          characterId: c.characterId,
          roleInScene: c.roleInScene?.trim() || null,
        }))
      );
    }

    // Insert thread joins if provided
    if (data.threadIds && data.threadIds.length > 0) {
      await db.insert(sceneThreads).values(
        data.threadIds.map((tid) => ({
          sceneId: inserted.id,
          threadId: tid,
        }))
      );
    }

    // Touch project updated_at
    await db.update(projects).set({ updatedAt: now }).where(eq(projects.id, data.projectId));

    const details = await getSceneWithDetails(inserted.id);
    return details!;
  }

  // Stub in-memory
  stubScenes.set(sceneId, record);
  if (data.characters) {
    stubSceneCharacters.set(
      sceneId,
      data.characters.map((c) => ({ characterId: c.characterId, roleInScene: c.roleInScene || null }))
    );
  }
  if (data.threadIds) {
    stubSceneThreads.set(sceneId, [...data.threadIds]);
  }

  const details = await getSceneWithDetails(sceneId);
  return details!;
}

export async function updateScene(
  id: string,
  data: Partial<Omit<NewScene, 'id' | 'projectId' | 'createdAt'>> & {
    characters?: { characterId: string; roleInScene?: string | null }[];
    threadIds?: string[];
  }
): Promise<SceneWithDetails | null> {
  const existing = await findSceneById(id);
  if (!existing) return null;

  const now = new Date();
  const { characters: joinChars, threadIds: joinThreads, ...directFields } = data;

  if (db) {
    await db
      .update(scenes)
      .set({
        ...directFields,
        updatedAt: now,
      })
      .where(eq(scenes.id, id));

    if (joinChars !== undefined) {
      await db.delete(sceneCharacters).where(eq(sceneCharacters.sceneId, id));
      if (joinChars.length > 0) {
        await db.insert(sceneCharacters).values(
          joinChars.map((c) => ({
            sceneId: id,
            characterId: c.characterId,
            roleInScene: c.roleInScene?.trim() || null,
          }))
        );
      }
    }

    if (joinThreads !== undefined) {
      await db.delete(sceneThreads).where(eq(sceneThreads.sceneId, id));
      if (joinThreads.length > 0) {
        await db.insert(sceneThreads).values(
          joinThreads.map((tid) => ({
            sceneId: id,
            threadId: tid,
          }))
        );
      }
    }

    return await getSceneWithDetails(id);
  }

  // Stub in-memory
  const updated: Scene = {
    ...existing,
    ...directFields,
    updatedAt: now,
  };
  stubScenes.set(id, updated);

  if (joinChars !== undefined) {
    stubSceneCharacters.set(
      id,
      joinChars.map((c) => ({ characterId: c.characterId, roleInScene: c.roleInScene || null }))
    );
  }

  if (joinThreads !== undefined) {
    stubSceneThreads.set(id, [...joinThreads]);
  }

  return await getSceneWithDetails(id);
}

export async function softDeleteScene(id: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db.update(scenes).set({ deletedAt: now, updatedAt: now }).where(eq(scenes.id, id));
    return;
  }
  const existing = stubScenes.get(id);
  if (existing) {
    stubScenes.set(id, { ...existing, deletedAt: now, updatedAt: now });
  }
}

export async function restoreScene(id: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db.update(scenes).set({ deletedAt: null, updatedAt: now }).where(eq(scenes.id, id));
    return;
  }
  const existing = stubScenes.get(id);
  if (existing) {
    stubScenes.set(id, { ...existing, deletedAt: null, updatedAt: now });
  }
}

export async function permanentDeleteScene(id: string): Promise<void> {
  if (db) {
    await db.delete(scenes).where(eq(scenes.id, id));
    return;
  }
  stubScenes.delete(id);
  stubSceneCharacters.delete(id);
  stubSceneThreads.delete(id);
  stubScenePlays.delete(id);
}

export async function setSceneCharacters(
  sceneId: string,
  chars: { characterId: string; roleInScene?: string | null }[]
): Promise<void> {
  if (db) {
    await db.delete(sceneCharacters).where(eq(sceneCharacters.sceneId, sceneId));
    if (chars.length > 0) {
      await db.insert(sceneCharacters).values(
        chars.map((c) => ({
          sceneId,
          characterId: c.characterId,
          roleInScene: c.roleInScene?.trim() || null,
        }))
      );
    }
    return;
  }
  stubSceneCharacters.set(
    sceneId,
    chars.map((c) => ({ characterId: c.characterId, roleInScene: c.roleInScene || null }))
  );
}

export async function setSceneThreads(sceneId: string, threadIds: string[]): Promise<void> {
  if (db) {
    await db.delete(sceneThreads).where(eq(sceneThreads.sceneId, sceneId));
    if (threadIds.length > 0) {
      await db.insert(sceneThreads).values(
        threadIds.map((tid) => ({
          sceneId,
          threadId: tid,
        }))
      );
    }
    return;
  }
  stubSceneThreads.set(sceneId, [...threadIds]);
}

// Helpers for stub sync resolution
function findCharacterByIdSync(id: string): Character | null {
  return stubCharacters.get(id) ?? null;
}

function findThreadByIdSync(id: string): Thread | null {
  return stubThreads.get(id) ?? null;
}

function findActByIdSync(id: string): Act | null {
  return stubActs.get(id) ?? null;
}

function findChapterByIdSync(id: string): Chapter | null {
  return stubChapters.get(id) ?? null;
}

function findLocationByIdSync(id: string): Location | null {
  return stubLocations.get(id) ?? null;
}
