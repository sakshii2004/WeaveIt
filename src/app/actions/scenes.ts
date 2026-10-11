'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireProjectAccess, requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  createScene,
  updateScene,
  softDeleteScene,
  restoreScene,
  permanentDeleteScene,
  setSceneCharacters,
  setSceneThreads,
  type SceneWithDetails,
} from '@/db/queries/scenes';
import {
  createSceneSchema,
  updateSceneSchema,
  type CreateSceneInput,
  type UpdateSceneInput,
} from '@/lib/validators/scenes';
import type { ActionResponse } from './projects';

/**
 * Create a new scene (or seed stub) in a project
 */
export async function createSceneAction(
  projectId: string,
  data: CreateSceneInput
): Promise<ActionResponse<SceneWithDetails>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to create a scene.' };
  }

  const parsed = createSceneSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const scene = await createScene({
      projectId,
      ...parsed.data,
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: scene };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create scene. Please try again.' };
  }
}

/**
 * Update an existing scene's fields, cast joins, or thread joins
 */
export async function updateSceneAction(
  sceneId: string,
  data: UpdateSceneInput
): Promise<ActionResponse<SceneWithDetails>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to update a scene.' };
  }

  const parsed = updateSceneSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    const updated = await updateScene(sceneId, parsed.data);
    if (!updated) {
      return { success: false, error: 'Scene not found or could not be updated.' };
    }

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update scene. Please try again.' };
  }
}

/**
 * Soft delete a scene
 */
export async function softDeleteSceneAction(
  sceneId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to delete a scene.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    await softDeleteScene(sceneId);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: { id: sceneId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete scene.' };
  }
}

/**
 * Restore a soft-deleted scene
 */
export async function restoreSceneAction(
  sceneId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to restore a scene.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id, { allowDeleted: true });
    await restoreScene(sceneId);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: { id: sceneId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to restore scene.' };
  }
}

/**
 * Permanently delete a scene
 */
export async function permanentDeleteSceneAction(
  sceneId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to permanently delete a scene.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id, { allowDeleted: true });
    await permanentDeleteScene(sceneId);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: { id: sceneId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete scene permanently.' };
  }
}

/**
 * Update characters in a scene
 */
export async function setSceneCharactersAction(
  sceneId: string,
  characters: { characterId: string; roleInScene?: string | null }[]
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    await setSceneCharacters(sceneId, characters);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: { id: sceneId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update scene characters.' };
  }
}

/**
 * Update threads in a scene
 */
export async function setSceneThreadsAction(
  sceneId: string,
  threadIds: string[]
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    await setSceneThreads(sceneId, threadIds);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: { id: sceneId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update scene threads.' };
  }
}
