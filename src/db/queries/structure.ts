import { eq, and, asc } from 'drizzle-orm';
import { db } from '../index';
import {
  acts,
  chapters,
  locations,
  threads,
  type Act,
  type Chapter,
  type Location,
  type Thread,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';

// In-memory stub fallback stores for headless test/CI mode
export const stubActs = new Map<string, Act>();
export const stubChapters = new Map<string, Chapter>();
export const stubLocations = new Map<string, Location>();
export const stubThreads = new Map<string, Thread>();

export function clearStructureStubsForTesting() {
  stubActs.clear();
  stubChapters.clear();
  stubLocations.clear();
  stubThreads.clear();
}

/* ==========================================================================
   ACTS QUERIES
   ========================================================================== */

export async function listActsByProject(projectId: string): Promise<Act[]> {
  if (db) {
    return await db
      .select()
      .from(acts)
      .where(eq(acts.projectId, projectId))
      .orderBy(asc(acts.orderIndex));
  }
  return Array.from(stubActs.values())
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function findActById(id: string): Promise<Act | null> {
  if (db) {
    const res = await db.select().from(acts).where(eq(acts.id, id)).limit(1);
    return res[0] ?? null;
  }
  return stubActs.get(id) ?? null;
}

export async function createAct(data: {
  projectId: string;
  name: string;
  color: string;
  orderIndex?: number;
}): Promise<Act> {
  const actId = uuidv7();
  const now = new Date();

  // If orderIndex not provided, determine next index
  let orderIndex = data.orderIndex;
  if (orderIndex === undefined) {
    const existing = await listActsByProject(data.projectId);
    orderIndex = existing.length;
  }

  const record: Act = {
    id: actId,
    projectId: data.projectId,
    name: data.name.trim(),
    color: data.color,
    orderIndex,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(acts).values(record).returning();
    return inserted;
  }

  stubActs.set(actId, record);
  return record;
}

export async function updateAct(
  id: string,
  data: { name?: string; color?: string; orderIndex?: number }
): Promise<Act | null> {
  const existing = await findActById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db.update(acts).set(updateData).where(eq(acts.id, id)).returning();
    return updated ?? null;
  }

  const updatedRecord = { ...existing, ...updateData };
  stubActs.set(id, updatedRecord);
  return updatedRecord;
}

export async function deleteAct(id: string): Promise<void> {
  if (db) {
    await db.delete(acts).where(eq(acts.id, id));
    return;
  }
  stubActs.delete(id);
}

export async function reorderActs(projectId: string, actIds: string[]): Promise<void> {
  const now = new Date();
  for (let idx = 0; idx < actIds.length; idx++) {
    const id = actIds[idx];
    if (db) {
      await db
        .update(acts)
        .set({ orderIndex: idx, updatedAt: now })
        .where(and(eq(acts.id, id), eq(acts.projectId, projectId)));
    } else {
      const existing = stubActs.get(id);
      if (existing && existing.projectId === projectId) {
        stubActs.set(id, { ...existing, orderIndex: idx, updatedAt: now });
      }
    }
  }
}

/* ==========================================================================
   CHAPTERS QUERIES
   ========================================================================== */

export async function listChaptersByProject(projectId: string, mapId?: string): Promise<Chapter[]> {
  if (db) {
    const conditions = [eq(chapters.projectId, projectId)];
    if (mapId) {
      conditions.push(eq(chapters.mapId, mapId));
    }
    return await db
      .select()
      .from(chapters)
      .where(and(...conditions))
      .orderBy(asc(chapters.orderIndex));
  }
  return Array.from(stubChapters.values())
    .filter((c) => c.projectId === projectId && (!mapId || c.mapId === mapId))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function findChapterById(id: string): Promise<Chapter | null> {
  if (db) {
    const res = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    return res[0] ?? null;
  }
  return stubChapters.get(id) ?? null;
}

export async function createChapter(data: {
  projectId: string;
  mapId?: string | null;
  title: string;
  orderIndex?: number;
}): Promise<Chapter> {
  const chapterId = uuidv7();
  const now = new Date();

  let orderIndex = data.orderIndex;
  if (orderIndex === undefined) {
    const existing = await listChaptersByProject(data.projectId);
    orderIndex = existing.length;
  }

  const record: Chapter = {
    id: chapterId,
    projectId: data.projectId,
    mapId: data.mapId ?? null,
    title: data.title.trim(),
    orderIndex,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(chapters).values(record).returning();
    return inserted;
  }

  stubChapters.set(chapterId, record);
  return record;
}

export async function updateChapter(
  id: string,
  data: { title?: string; orderIndex?: number; mapId?: string | null }
): Promise<Chapter | null> {
  const existing = await findChapterById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData = {
    ...(data.title !== undefined ? { title: data.title.trim() } : {}),
    ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
    ...(data.mapId !== undefined ? { mapId: data.mapId } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db.update(chapters).set(updateData).where(eq(chapters.id, id)).returning();
    return updated ?? null;
  }

  const updatedRecord = { ...existing, ...updateData };
  stubChapters.set(id, updatedRecord);
  return updatedRecord;
}

export async function deleteChapter(id: string): Promise<void> {
  if (db) {
    await db.delete(chapters).where(eq(chapters.id, id));
    return;
  }
  stubChapters.delete(id);
}

export async function reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
  const now = new Date();
  for (let idx = 0; idx < chapterIds.length; idx++) {
    const id = chapterIds[idx];
    if (db) {
      await db
        .update(chapters)
        .set({ orderIndex: idx, updatedAt: now })
        .where(and(eq(chapters.id, id), eq(chapters.projectId, projectId)));
    } else {
      const existing = stubChapters.get(id);
      if (existing && existing.projectId === projectId) {
        stubChapters.set(id, { ...existing, orderIndex: idx, updatedAt: now });
      }
    }
  }
}

/* ==========================================================================
   LOCATIONS QUERIES
   ========================================================================== */

export async function listLocationsByProject(projectId: string): Promise<Location[]> {
  if (db) {
    return await db
      .select()
      .from(locations)
      .where(eq(locations.projectId, projectId))
      .orderBy(asc(locations.name));
  }
  return Array.from(stubLocations.values())
    .filter((l) => l.projectId === projectId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findLocationById(id: string): Promise<Location | null> {
  if (db) {
    const res = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    return res[0] ?? null;
  }
  return stubLocations.get(id) ?? null;
}

export async function createLocation(data: {
  projectId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}): Promise<Location> {
  const locationId = uuidv7();
  const now = new Date();

  const record: Location = {
    id: locationId,
    projectId: data.projectId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    imageUrl: data.imageUrl || null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(locations).values(record).returning();
    return inserted;
  }

  stubLocations.set(locationId, record);
  return record;
}

export async function updateLocation(
  id: string,
  data: { name?: string; description?: string | null; imageUrl?: string | null }
): Promise<Location | null> {
  const existing = await findLocationById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db.update(locations).set(updateData).where(eq(locations.id, id)).returning();
    return updated ?? null;
  }

  const updatedRecord = { ...existing, ...updateData };
  stubLocations.set(id, updatedRecord);
  return updatedRecord;
}

export async function deleteLocation(id: string): Promise<void> {
  if (db) {
    await db.delete(locations).where(eq(locations.id, id));
    return;
  }
  stubLocations.delete(id);
}

/* ==========================================================================
   THREADS QUERIES
   ========================================================================== */

export async function listThreadsByProject(projectId: string): Promise<Thread[]> {
  if (db) {
    return await db
      .select()
      .from(threads)
      .where(eq(threads.projectId, projectId))
      .orderBy(asc(threads.name));
  }
  return Array.from(stubThreads.values())
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findThreadById(id: string): Promise<Thread | null> {
  if (db) {
    const res = await db.select().from(threads).where(eq(threads.id, id)).limit(1);
    return res[0] ?? null;
  }
  return stubThreads.get(id) ?? null;
}

export async function createThread(data: {
  projectId: string;
  name: string;
  color: string;
  description?: string | null;
}): Promise<Thread> {
  const threadId = uuidv7();
  const now = new Date();

  const record: Thread = {
    id: threadId,
    projectId: data.projectId,
    name: data.name.trim(),
    color: data.color,
    description: data.description?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(threads).values(record).returning();
    return inserted;
  }

  stubThreads.set(threadId, record);
  return record;
}

export async function updateThread(
  id: string,
  data: { name?: string; color?: string; description?: string | null }
): Promise<Thread | null> {
  const existing = await findThreadById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db.update(threads).set(updateData).where(eq(threads.id, id)).returning();
    return updated ?? null;
  }

  const updatedRecord = { ...existing, ...updateData };
  stubThreads.set(id, updatedRecord);
  return updatedRecord;
}

export async function deleteThread(id: string): Promise<void> {
  if (db) {
    await db.delete(threads).where(eq(threads.id, id));
    return;
  }
  stubThreads.delete(id);
}
