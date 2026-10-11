import { eq } from 'drizzle-orm';
import { db } from '../index';
import { scenePlays, type ScenePlay } from '../schema';
import type { PlayBeat } from '@/lib/validators/play';
import { v7 as uuidv7 } from 'uuid';

// In-memory fallback stores for test/offline stub mode
// Key: sceneId -> ScenePlay
export const stubScenePlays = new Map<string, ScenePlay>();

export function clearPlayStubsForTesting() {
  stubScenePlays.clear();
}

/**
 * Find scene play by scene ID
 */
export async function findScenePlayBySceneId(sceneId: string): Promise<ScenePlay | null> {
  if (db) {
    const rows = await db
      .select()
      .from(scenePlays)
      .where(eq(scenePlays.sceneId, sceneId))
      .limit(1);
    return rows[0] ?? null;
  }

  return stubScenePlays.get(sceneId) ?? null;
}

/**
 * Upsert scene play (create or update beats and purpose note)
 */
export async function upsertScenePlay(
  sceneId: string,
  data: {
    content: PlayBeat[];
    purposeNote?: string | null;
  }
): Promise<ScenePlay> {
  const now = new Date();

  if (db) {
    const existing = await findScenePlayBySceneId(sceneId);

    if (existing) {
      const updated = await db
        .update(scenePlays)
        .set({
          content: data.content,
          purposeNote: data.purposeNote !== undefined ? data.purposeNote : existing.purposeNote,
          updatedAt: now,
        })
        .where(eq(scenePlays.sceneId, sceneId))
        .returning();

      return updated[0];
    } else {
      const inserted = await db
        .insert(scenePlays)
        .values({
          sceneId,
          content: data.content,
          purposeNote: data.purposeNote ?? null,
        })
        .returning();

      return inserted[0];
    }
  }

  // Stub in-memory upsert
  const existing = stubScenePlays.get(sceneId);
  if (existing) {
    const updated: ScenePlay = {
      ...existing,
      content: data.content,
      purposeNote: data.purposeNote !== undefined ? data.purposeNote : existing.purposeNote,
      updatedAt: now,
    };
    stubScenePlays.set(sceneId, updated);
    return updated;
  }

  const created: ScenePlay = {
    id: uuidv7(),
    sceneId,
    content: data.content,
    purposeNote: data.purposeNote ?? null,
    createdAt: now,
    updatedAt: now,
  };
  stubScenePlays.set(sceneId, created);
  return created;
}

/**
 * Delete scene play by scene ID
 */
export async function deleteScenePlay(sceneId: string): Promise<void> {
  if (db) {
    await db.delete(scenePlays).where(eq(scenePlays.sceneId, sceneId));
    return;
  }

  stubScenePlays.delete(sceneId);
}
