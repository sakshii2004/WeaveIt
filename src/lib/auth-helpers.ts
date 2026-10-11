import { findProjectById } from '@/db/queries/projects';
import { findCharacterById } from '@/db/queries/characters';
import { findSceneById } from '@/db/queries/scenes';
import { findActById, findChapterById, findLocationById, findThreadById } from '@/db/queries/structure';
import { findStoryMapById } from '@/db/queries/maps';
import type { Project, Character, Scene, Act, Chapter, Location, Thread, StoryMap } from '@/db/schema';

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to access this resource') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Enforces ownership isolation per PRD §6:
 * "Every query is scoped by project.owner_id. Never trust client-supplied IDs without
 * ownership checks. Write a single requireProjectAccess(projectId, userId) helper and use it everywhere."
 */
export async function requireProjectAccess(
  projectId: string,
  userId: string,
  options?: { allowDeleted?: boolean }
): Promise<Project> {
  if (!projectId || !userId) {
    throw new ForbiddenError('Valid project ID and user credentials are required');
  }

  const project = await findProjectById(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (!options?.allowDeleted && project.deletedAt) {
    throw new NotFoundError('Project has been deleted');
  }

  if (project.ownerId !== userId) {
    throw new ForbiddenError('You do not have permission to access this project');
  }

  return project;
}

/**
 * Enforces ownership isolation for characters by verifying transitive project ownership.
 */
export async function requireCharacterAccess(
  characterId: string,
  userId: string,
  options?: { allowDeleted?: boolean }
): Promise<{ character: Character; project: Project }> {
  if (!characterId || !userId) {
    throw new ForbiddenError('Valid character ID and user credentials are required');
  }

  const character = await findCharacterById(characterId);
  if (!character) {
    throw new NotFoundError('Character not found');
  }

  if (!options?.allowDeleted && character.deletedAt) {
    throw new NotFoundError('Character has been deleted');
  }

  const project = await requireProjectAccess(character.projectId, userId, options);
  return { character, project };
}

/**
 * Enforces ownership isolation for scenes by verifying transitive project ownership.
 */
export async function requireSceneAccess(
  sceneId: string,
  userId: string,
  options?: { allowDeleted?: boolean }
): Promise<{ scene: Scene; project: Project }> {
  if (!sceneId || !userId) {
    throw new ForbiddenError('Valid scene ID and user credentials are required');
  }

  const scene = await findSceneById(sceneId);
  if (!scene) {
    throw new NotFoundError('Scene not found');
  }

  if (!options?.allowDeleted && scene.deletedAt) {
    throw new NotFoundError('Scene has been deleted');
  }

  const project = await requireProjectAccess(scene.projectId, userId, options);
  return { scene, project };
}

/**
 * Enforces ownership isolation for acts by verifying transitive project ownership.
 */
export async function requireActAccess(
  actId: string,
  userId: string
): Promise<{ act: Act; project: Project }> {
  if (!actId || !userId) {
    throw new ForbiddenError('Valid act ID and user credentials are required');
  }

  const act = await findActById(actId);
  if (!act) {
    throw new NotFoundError('Act not found');
  }

  const project = await requireProjectAccess(act.projectId, userId);
  return { act, project };
}

/**
 * Enforces ownership isolation for chapters by verifying transitive project ownership.
 */
export async function requireChapterAccess(
  chapterId: string,
  userId: string
): Promise<{ chapter: Chapter; project: Project }> {
  if (!chapterId || !userId) {
    throw new ForbiddenError('Valid chapter ID and user credentials are required');
  }

  const chapter = await findChapterById(chapterId);
  if (!chapter) {
    throw new NotFoundError('Chapter not found');
  }

  const project = await requireProjectAccess(chapter.projectId, userId);
  return { chapter, project };
}

/**
 * Enforces ownership isolation for locations by verifying transitive project ownership.
 */
export async function requireLocationAccess(
  locationId: string,
  userId: string
): Promise<{ location: Location; project: Project }> {
  if (!locationId || !userId) {
    throw new ForbiddenError('Valid location ID and user credentials are required');
  }

  const location = await findLocationById(locationId);
  if (!location) {
    throw new NotFoundError('Location not found');
  }

  const project = await requireProjectAccess(location.projectId, userId);
  return { location, project };
}

/**
 * Enforces ownership isolation for threads by verifying transitive project ownership.
 */
export async function requireThreadAccess(
  threadId: string,
  userId: string
): Promise<{ thread: Thread; project: Project }> {
  if (!threadId || !userId) {
    throw new ForbiddenError('Valid thread ID and user credentials are required');
  }

  const thread = await findThreadById(threadId);
  if (!thread) {
    throw new NotFoundError('Thread not found');
  }

  const project = await requireProjectAccess(thread.projectId, userId);
  return { thread, project };
}

/**
 * Enforces ownership isolation for story maps by verifying transitive project ownership.
 */
export async function requireMapAccess(
  mapId: string,
  userId: string
): Promise<{ map: StoryMap; project: Project }> {
  if (!mapId || !userId) {
    throw new ForbiddenError('Valid map ID and user credentials are required');
  }

  const map = await findStoryMapById(mapId);
  if (!map) {
    throw new NotFoundError('Story Map not found');
  }

  const project = await requireProjectAccess(map.projectId, userId);
  return { map, project };
}

