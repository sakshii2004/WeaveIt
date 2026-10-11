'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  findScenePlayBySceneId,
  upsertScenePlay,
} from '@/db/queries/play';
import { updateScene, type SceneWithDetails } from '@/db/queries/scenes';
import {
  saveScenePlaySchema,
  type SaveScenePlayInput,
} from '@/lib/validators/play';
import type { ScenePlay } from '@/db/schema';
import type { SceneStatus } from '@/lib/validators/scenes';
import type { ActionResponse } from './projects';

/**
 * Fetch scene play for a scene with transitive ownership check
 */
export async function getScenePlayAction(
  sceneId: string
): Promise<ActionResponse<ScenePlay | null>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to view scene scripting.' };
  }

  try {
    await requireSceneAccess(sceneId, session.user.id);
    const play = await findScenePlayBySceneId(sceneId);
    return { success: true, data: play };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to load scene script.' };
  }
}

/**
 * Save scene play (beats array and purpose note) with autosave resilience
 */
export async function saveScenePlayAction(
  sceneId: string,
  input: SaveScenePlayInput
): Promise<ActionResponse<ScenePlay>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to save scene scripting.' };
  }

  const parsed = saveScenePlaySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix validation errors in the script.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    const play = await upsertScenePlay(sceneId, parsed.data);

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: play };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to save scene script. Please try again.' };
  }
}

/**
 * Manual scene status transition trigger (e.g. marking scene as 'played')
 * Adheres strictly to PRD §8.6: "Setting scene status to played is manual, never automatic."
 */
export async function updateSceneStatusAction(
  sceneId: string,
  status: SceneStatus
): Promise<ActionResponse<SceneWithDetails>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to update scene status.' };
  }

  try {
    const { scene } = await requireSceneAccess(sceneId, session.user.id);
    const updated = await updateScene(sceneId, { status });
    if (!updated) {
      return { success: false, error: 'Scene not found or could not be updated.' };
    }

    revalidatePath(`/projects/${scene.projectId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update scene status.' };
  }
}
