import { eq, and, isNull, isNotNull, desc, asc, sql } from 'drizzle-orm';
import { db } from '../index';
import {
  projects,
  acts,
  storyMaps,
  scenes,
  type Project,
  type NewProject,
  type Act,
  type StoryMap,
  type Scene,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';

import { stubStoryMaps } from './maps';

// In-memory fallback stores for test/offline stub mode
const stubProjects = new Map<string, Project>();
const stubActs = new Map<string, Act>();
const stubScenes = new Map<string, Scene>();

export async function findProjectById(id: string): Promise<Project | null> {
  if (db) {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubProjects.get(id) ?? null;
}

export async function listProjectsByUser(
  userId: string
): Promise<(Project & { sceneCount: number })[]> {
  if (db) {
    // Left join with non-deleted scenes to calculate scene count per project
    const rows = await db
      .select({
        project: projects,
        sceneCount: sql<number>`count(${scenes.id}) filter (where ${scenes.deletedAt} is null)::int`,
      })
      .from(projects)
      .leftJoin(scenes, eq(scenes.projectId, projects.id))
      .where(and(eq(projects.ownerId, userId), isNull(projects.deletedAt)))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    return rows.map((r) => ({
      ...r.project,
      sceneCount: Number(r.sceneCount ?? 0),
    }));
  }

  const userProjects = Array.from(stubProjects.values())
    .filter((p) => p.ownerId === userId && !p.deletedAt)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return userProjects.map((p) => {
    const sceneCount = Array.from(stubScenes.values()).filter(
      (s) => s.projectId === p.id && !s.deletedAt
    ).length;
    return { ...p, sceneCount };
  });
}

export async function listRecentlyDeletedProjects(userId: string): Promise<Project[]> {
  if (db) {
    return db
      .select()
      .from(projects)
      .where(and(eq(projects.ownerId, userId), isNotNull(projects.deletedAt)))
      .orderBy(desc(projects.deletedAt));
  }

  return Array.from(stubProjects.values())
    .filter((p) => p.ownerId === userId && p.deletedAt)
    .sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));
}

export async function createProjectWithDefaults(data: {
  ownerId: string;
  title: string;
  logline?: string | null;
  genre?: string | null;
  coverImageUrl?: string | null;
}): Promise<Project> {
  const projectId = uuidv7();
  const now = new Date();

  const newProjectRecord: Project = {
    id: projectId,
    ownerId: data.ownerId,
    title: data.title.trim(),
    logline: data.logline?.trim() || null,
    genre: data.genre?.trim() || null,
    coverImageUrl: data.coverImageUrl?.trim() || null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const defaultActsData = [
    {
      id: uuidv7(),
      projectId,
      name: 'Act I: Setup',
      orderIndex: 0,
      color: 'teal',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv7(),
      projectId,
      name: 'Act II: Confrontation',
      orderIndex: 1,
      color: 'sun',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv7(),
      projectId,
      name: 'Act III: Resolution',
      orderIndex: 2,
      color: 'lavender',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const defaultStoryMapData = {
    id: uuidv7(),
    projectId,
    name: 'Main Story Map',
    kind: 'story',
    isDefault: true,
    viewport: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    // Insert project
    const [project] = await db.insert(projects).values(newProjectRecord).returning();

    // Insert default acts
    await db.insert(acts).values(defaultActsData);

    // Insert default story map
    await db.insert(storyMaps).values(defaultStoryMapData);

    return project;
  }

  // Stub fallback
  stubProjects.set(projectId, newProjectRecord);
  for (const act of defaultActsData) {
    stubActs.set(act.id, act);
  }
  stubStoryMaps.set(defaultStoryMapData.id, defaultStoryMapData);

  return newProjectRecord;
}

export async function updateProject(
  projectId: string,
  data: Partial<Pick<NewProject, 'title' | 'logline' | 'genre' | 'coverImageUrl'>>
): Promise<Project> {
  const now = new Date();
  if (db) {
    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(projects.id, projectId))
      .returning();
    return updated;
  }

  const existing = stubProjects.get(projectId);
  if (!existing) throw new Error('Project not found');
  const updated = { ...existing, ...data, updatedAt: now };
  stubProjects.set(projectId, updated);
  return updated;
}

export async function softDeleteProject(projectId: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db
      .update(projects)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(projects.id, projectId));
    return;
  }

  const existing = stubProjects.get(projectId);
  if (existing) {
    stubProjects.set(projectId, { ...existing, deletedAt: now, updatedAt: now });
  }
}

export async function restoreProject(projectId: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db
      .update(projects)
      .set({ deletedAt: null, updatedAt: now })
      .where(eq(projects.id, projectId));
    return;
  }

  const existing = stubProjects.get(projectId);
  if (existing) {
    stubProjects.set(projectId, { ...existing, deletedAt: null, updatedAt: now });
  }
}

export async function permanentDeleteProject(projectId: string): Promise<void> {
  if (db) {
    await db.delete(projects).where(eq(projects.id, projectId));
    return;
  }

  stubProjects.delete(projectId);
  // Remove related stub child items
  for (const [id, act] of stubActs.entries()) {
    if (act.projectId === projectId) stubActs.delete(id);
  }
  for (const [id, map] of stubStoryMaps.entries()) {
    if (map.projectId === projectId) stubStoryMaps.delete(id);
  }
  for (const [id, scene] of stubScenes.entries()) {
    if (scene.projectId === projectId) stubScenes.delete(id);
  }
}

export async function createSeedScene(projectId: string, title: string): Promise<Scene> {
  const sceneId = uuidv7();
  const now = new Date();
  const newSceneRecord: Scene = {
    id: sceneId,
    projectId,
    title: title.trim(),
    status: 'seed',
    description: null,
    sceneType: null,
    purpose: null,
    locationId: null,
    chapterId: null,
    timeLabel: null,
    actId: null,
    color: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [scene] = await db.insert(scenes).values(newSceneRecord).returning();
    // Also bump project's updatedAt
    await db.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId));
    return scene;
  }

  stubScenes.set(sceneId, newSceneRecord);
  const proj = stubProjects.get(projectId);
  if (proj) {
    stubProjects.set(projectId, { ...proj, updatedAt: now });
  }
  return newSceneRecord;
}

export async function listRecentScenes(projectId: string, limit = 20): Promise<Scene[]> {
  if (db) {
    return db
      .select()
      .from(scenes)
      .where(and(eq(scenes.projectId, projectId), isNull(scenes.deletedAt)))
      .orderBy(desc(scenes.createdAt))
      .limit(limit);
  }

  return Array.from(stubScenes.values())
    .filter((s) => s.projectId === projectId && !s.deletedAt)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function listProjectActs(projectId: string): Promise<Act[]> {
  if (db) {
    return db
      .select()
      .from(acts)
      .where(eq(acts.projectId, projectId))
      .orderBy(asc(acts.orderIndex));
  }

  return Array.from(stubActs.values())
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getDefaultStoryMap(projectId: string): Promise<StoryMap | null> {
  if (db) {
    const rows = await db
      .select()
      .from(storyMaps)
      .where(and(eq(storyMaps.projectId, projectId), eq(storyMaps.isDefault, true)))
      .limit(1);
    return rows[0] ?? null;
  }

  for (const map of stubStoryMaps.values()) {
    if (map.projectId === projectId && map.isDefault) {
      return map;
    }
  }
  return null;
}
