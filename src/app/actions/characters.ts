'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireProjectAccess, requireCharacterAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  createCharacter,
  updateCharacter,
  softDeleteCharacter,
  restoreCharacter,
  permanentDeleteCharacter,
  findCharacterById,
  replaceCustomFields,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  findRelationshipById,
} from '@/db/queries/characters';
import {
  createCharacterSchema,
  updateCharacterSchema,
  customFieldsArraySchema,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '@/lib/validators/characters';
import type { Character, CharacterCustomField, CharacterRelationship } from '@/db/schema';
import type { ActionResponse } from './projects';

/**
 * Create a new character in a project
 */
export async function createCharacterAction(
  projectId: string,
  data: {
    name: string;
    role?: string;
    roleCustom?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    personality?: string | null;
    goals?: string | null;
    fears?: string | null;
    background?: string | null;
    arc?: string | null;
  }
): Promise<ActionResponse<Character>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to create a character.' };
  }

  const parsed = createCharacterSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const character = await createCharacter({
      projectId,
      ...parsed.data,
    });

    revalidatePath(`/projects/${projectId}/characters`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, data: character };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create character. Please try again.' };
  }
}

/**
 * Update character profile fields
 */
export async function updateCharacterAction(
  characterId: string,
  data: {
    name?: string;
    role?: string;
    roleCustom?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    personality?: string | null;
    goals?: string | null;
    fears?: string | null;
    background?: string | null;
    arc?: string | null;
  }
): Promise<ActionResponse<Character>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to update a character.' };
  }

  const parsed = updateCharacterSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { character } = await requireCharacterAccess(characterId, session.user.id);
    const updated = await updateCharacter(characterId, parsed.data);

    revalidatePath(`/projects/${character.projectId}/characters`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update character. Please try again.' };
  }
}

/**
 * Soft delete a character
 */
export async function softDeleteCharacterAction(characterId: string): Promise<ActionResponse<{ id: string; projectId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to delete a character.' };
  }

  try {
    const { character } = await requireCharacterAccess(characterId, session.user.id);
    await softDeleteCharacter(characterId);

    revalidatePath(`/projects/${character.projectId}/characters`);
    revalidatePath(`/projects/${character.projectId}`);
    return { success: true, data: { id: characterId, projectId: character.projectId } };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete character.' };
  }
}

/**
 * Restore a soft-deleted character
 */
export async function restoreCharacterAction(characterId: string): Promise<ActionResponse<Character>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to restore a character.' };
  }

  try {
    const { character } = await requireCharacterAccess(characterId, session.user.id, { allowDeleted: true });
    await restoreCharacter(characterId);

    revalidatePath(`/projects/${character.projectId}/characters`);
    revalidatePath(`/projects/${character.projectId}`);
    return { success: true, data: character };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to restore character.' };
  }
}

/**
 * Permanently delete a character and all its custom fields/relationships
 */
export async function permanentDeleteCharacterAction(characterId: string): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to permanently delete a character.' };
  }

  try {
    const { character } = await requireCharacterAccess(characterId, session.user.id, { allowDeleted: true });
    await permanentDeleteCharacter(characterId);

    revalidatePath(`/projects/${character.projectId}/characters`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete character permanently.' };
  }
}

/**
 * Atomically replace custom fields on a character per PRD §9 PUT /api/characters/:cid/fields
 */
export async function replaceCustomFieldsAction(
  characterId: string,
  fields: Array<{ key: string; value: string; orderIndex: number }>
): Promise<ActionResponse<CharacterCustomField[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to edit custom fields.' };
  }

  const parsed = customFieldsArraySchema.safeParse(fields);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid field data. Ensure all keys are filled.',
    };
  }

  try {
    const { character } = await requireCharacterAccess(characterId, session.user.id);
    const updatedFields = await replaceCustomFields(characterId, parsed.data);

    revalidatePath(`/projects/${character.projectId}/characters`);
    return { success: true, data: updatedFields };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update custom fields.' };
  }
}

/**
 * Create a relationship between two characters
 */
export async function createRelationshipAction(
  projectId: string,
  data: {
    sourceCharacterId: string;
    targetCharacterId: string;
    type: string;
    description?: string | null;
    isDirected?: boolean;
    startSceneId?: string | null;
    endSceneId?: string | null;
  }
): Promise<ActionResponse<CharacterRelationship>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to add a relationship.' };
  }

  const parsed = createRelationshipSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);

    // Verify both characters belong to project
    const source = await findCharacterById(parsed.data.sourceCharacterId);
    const target = await findCharacterById(parsed.data.targetCharacterId);

    if (!source || source.projectId !== projectId || !target || target.projectId !== projectId) {
      return { success: false, error: 'Both characters must belong to this project.' };
    }

    const rel = await createRelationship({
      projectId,
      ...parsed.data,
    });

    revalidatePath(`/projects/${projectId}/characters`);
    return { success: true, data: rel };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to create relationship.' };
  }
}

/**
 * Update relationship details
 */
export async function updateRelationshipAction(
  relationshipId: string,
  data: {
    type?: string;
    description?: string | null;
    isDirected?: boolean;
    startSceneId?: string | null;
    endSceneId?: string | null;
  }
): Promise<ActionResponse<CharacterRelationship>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to update a relationship.' };
  }

  const parsed = updateRelationshipSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await findRelationshipById(relationshipId);
    if (!existing) {
      return { success: false, error: 'Relationship not found.' };
    }

    await requireProjectAccess(existing.projectId, session.user.id);
    const updated = await updateRelationship(relationshipId, parsed.data);

    revalidatePath(`/projects/${existing.projectId}/characters`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update relationship.' };
  }
}

/**
 * Delete a relationship
 */
export async function deleteRelationshipAction(relationshipId: string): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to delete a relationship.' };
  }

  try {
    const existing = await findRelationshipById(relationshipId);
    if (!existing) {
      return { success: false, error: 'Relationship not found.' };
    }

    await requireProjectAccess(existing.projectId, session.user.id);
    await deleteRelationship(relationshipId);

    revalidatePath(`/projects/${existing.projectId}/characters`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete relationship.' };
  }
}
