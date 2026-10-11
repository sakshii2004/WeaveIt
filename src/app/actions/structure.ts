'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import {
  requireProjectAccess,
  requireActAccess,
  requireChapterAccess,
  requireLocationAccess,
  requireThreadAccess,
  NotFoundError,
  ForbiddenError,
} from '@/lib/auth-helpers';
import {
  createAct,
  updateAct,
  deleteAct,
  reorderActs,
  listChaptersByProject,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  createLocation,
  updateLocation,
  deleteLocation,
  createThread,
  updateThread,
  deleteThread,
} from '@/db/queries/structure';
import {
  createActSchema,
  updateActSchema,
  reorderActsSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
  createLocationSchema,
  updateLocationSchema,
  createThreadSchema,
  updateThreadSchema,
} from '@/lib/validators/structure';
import type { Act, Chapter, Location, Thread } from '@/db/schema';
import type { ActionResponse } from './projects';

/* ==========================================================================
   ACTS ACTIONS
   ========================================================================== */

export async function createActAction(
  projectId: string,
  data: { name: string; color: string; orderIndex?: number }
): Promise<ActionResponse<Act>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = createActSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid act data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const act = await createAct({ projectId, ...parsed.data });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: act };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create act.' };
  }
}

export async function updateActAction(
  actId: string,
  data: { name?: string; color?: string; orderIndex?: number }
): Promise<ActionResponse<Act>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = updateActSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid act data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { project } = await requireActAccess(actId, session.user.id);
    const updated = await updateAct(actId, parsed.data);
    if (!updated) return { success: false, error: 'Act not found.' };

    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update act.' };
  }
}

export async function deleteActAction(actId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { project } = await requireActAccess(actId, session.user.id);
    await deleteAct(actId);
    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: { id: actId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete act.' };
  }
}

export async function reorderActsAction(
  projectId: string,
  actIds: string[]
): Promise<ActionResponse<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = reorderActsSchema.safeParse({ actIds });
  if (!parsed.success) {
    return { success: false, error: 'Invalid act IDs for reordering' };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    await reorderActs(projectId, parsed.data.actIds);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to reorder acts.' };
  }
}

/* ==========================================================================
   CHAPTERS ACTIONS
   ========================================================================== */

export async function createChapterAction(
  projectId: string,
  data: { title: string; mapId?: string | null; orderIndex?: number }
): Promise<ActionResponse<Chapter>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = createChapterSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid chapter data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);

    // Prevent duplicate chapter titles within the same project
    const existingChapters = await listChaptersByProject(projectId);
    const normalizedTitle = parsed.data.title.trim().toLowerCase();
    const duplicate = existingChapters.find(
      (ch) => ch.title.trim().toLowerCase() === normalizedTitle
    );
    if (duplicate) {
      return { success: false, error: `A chapter titled "${duplicate.title}" already exists.` };
    }

    const chapter = await createChapter({ projectId, ...parsed.data });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: chapter };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create chapter.' };
  }
}

export async function updateChapterAction(
  chapterId: string,
  data: { title?: string; orderIndex?: number; mapId?: string | null }
): Promise<ActionResponse<Chapter>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = updateChapterSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid chapter data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { project } = await requireChapterAccess(chapterId, session.user.id);
    const updated = await updateChapter(chapterId, parsed.data);
    if (!updated) return { success: false, error: 'Chapter not found.' };

    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update chapter.' };
  }
}

export async function deleteChapterAction(chapterId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { project } = await requireChapterAccess(chapterId, session.user.id);
    await deleteChapter(chapterId);
    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: { id: chapterId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete chapter.' };
  }
}

export async function reorderChaptersAction(
  projectId: string,
  chapterIds: string[]
): Promise<ActionResponse<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = reorderChaptersSchema.safeParse({ chapterIds });
  if (!parsed.success) {
    return { success: false, error: 'Invalid chapter IDs for reordering' };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    await reorderChapters(projectId, parsed.data.chapterIds);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to reorder chapters.' };
  }
}

/* ==========================================================================
   LOCATIONS ACTIONS
   ========================================================================== */

export async function createLocationAction(
  projectId: string,
  data: { name: string; description?: string | null; imageUrl?: string | null }
): Promise<ActionResponse<Location>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = createLocationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid location data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const location = await createLocation({ projectId, ...parsed.data });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: location };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create location.' };
  }
}

export async function updateLocationAction(
  locationId: string,
  data: { name?: string; description?: string | null; imageUrl?: string | null }
): Promise<ActionResponse<Location>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = updateLocationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid location data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { project } = await requireLocationAccess(locationId, session.user.id);
    const updated = await updateLocation(locationId, parsed.data);
    if (!updated) return { success: false, error: 'Location not found.' };

    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update location.' };
  }
}

export async function deleteLocationAction(locationId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { project } = await requireLocationAccess(locationId, session.user.id);
    await deleteLocation(locationId);
    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: { id: locationId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete location.' };
  }
}

/* ==========================================================================
   THREADS ACTIONS
   ========================================================================== */

export async function createThreadAction(
  projectId: string,
  data: { name: string; color: string; description?: string | null }
): Promise<ActionResponse<Thread>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = createThreadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid thread data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const thread = await createThread({ projectId, ...parsed.data });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: thread };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create thread.' };
  }
}

export async function updateThreadAction(
  threadId: string,
  data: { name?: string; color?: string; description?: string | null }
): Promise<ActionResponse<Thread>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = updateThreadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid thread data', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { project } = await requireThreadAccess(threadId, session.user.id);
    const updated = await updateThread(threadId, parsed.data);
    if (!updated) return { success: false, error: 'Thread not found.' };

    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update thread.' };
  }
}

export async function deleteThreadAction(threadId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  try {
    const { project } = await requireThreadAccess(threadId, session.user.id);
    await deleteThread(threadId);
    revalidatePath(`/projects/${project.id}`);
    return { success: true, data: { id: threadId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete thread.' };
  }
}
