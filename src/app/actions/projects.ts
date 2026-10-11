'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  createProjectWithDefaults,
  updateProject,
  softDeleteProject,
  restoreProject,
  permanentDeleteProject,
  createSeedScene,
} from '@/db/queries/projects';
import {
  createProjectSchema,
  updateProjectSchema,
  permanentDeleteProjectSchema,
  quickAddSceneSchema,
} from '@/lib/validators/projects';
import type { Project, Scene } from '@/db/schema';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Create a new project workspace with default Acts (I, II, III) and primary Story Map
 */
export async function createProjectAction(
  data: {
    title: string;
    logline?: string;
    genre?: string;
    coverImageUrl?: string;
  }
): Promise<ActionResponse<Project>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to create a project' };
  }

  const validation = createProjectSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
      error: 'Please fix the project form errors.',
    };
  }

  try {
    const project = await createProjectWithDefaults({
      ownerId: session.user.id,
      title: validation.data.title,
      logline: validation.data.logline,
      genre: validation.data.genre,
      coverImageUrl: validation.data.coverImageUrl,
    });

    revalidatePath('/dashboard');
    return { success: true, data: project };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    return { success: false, error: message };
  }
}

/**
 * Update project details (title, logline, genre)
 */
export async function updateProjectAction(
  projectId: string,
  data: {
    title?: string;
    logline?: string;
    genre?: string;
    coverImageUrl?: string;
  }
): Promise<ActionResponse<Project>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to edit this project' };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);

    const validation = updateProjectSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        fieldErrors: validation.error.flatten().fieldErrors,
        error: 'Please fix the validation errors.',
      };
    }

    const updated = await updateProject(projectId, validation.data);
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    const message = err instanceof Error ? err.message : 'Failed to update project';
    return { success: false, error: message };
  }
}

/**
 * Soft delete project (moves to Recently Deleted)
 */
export async function softDeleteProjectAction(projectId: string): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    await softDeleteProject(projectId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    return { success: false, error: message };
  }
}

/**
 * Restore soft-deleted project
 */
export async function restoreProjectAction(projectId: string): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await requireProjectAccess(projectId, session.user.id, { allowDeleted: true });
    await restoreProject(projectId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    const message = err instanceof Error ? err.message : 'Failed to restore project';
    return { success: false, error: message };
  }
}

/**
 * Permanently delete project - requires typing the exact project name per PRD §8.2
 */
export async function permanentDeleteProjectAction(
  projectId: string,
  confirmTitle: string
): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = permanentDeleteProjectSchema.safeParse({ confirmTitle });
  if (!validation.success) {
    return { success: false, error: 'Please enter the project title to confirm deletion' };
  }

  try {
    const project = await requireProjectAccess(projectId, session.user.id, { allowDeleted: true });

    if (validation.data.confirmTitle.trim().toLowerCase() !== project.title.trim().toLowerCase()) {
      return {
        success: false,
        error: `Project title confirmation does not match. Please type "${project.title}" exactly.`,
      };
    }

    await permanentDeleteProject(projectId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    const message = err instanceof Error ? err.message : 'Failed to permanently delete project';
    return { success: false, error: message };
  }
}

/**
 * Quick-add a seed scene stub per PRD §8.2:
 * "Project home shows: logline, quick-add 'New scene' input (type one line, press Enter to create a seed scene)"
 */
export async function quickAddSceneAction(
  projectId: string,
  title: string
): Promise<ActionResponse<Scene>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = quickAddSceneSchema.safeParse({ title });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors.title?.[0] || 'Invalid scene title',
    };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const scene = await createSeedScene(projectId, validation.data.title);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: scene };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    const message = err instanceof Error ? err.message : 'Failed to add scene';
    return { success: false, error: message };
  }
}
