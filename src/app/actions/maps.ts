'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireProjectAccess, requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  createStoryMap,
  updateStoryMap,
  deleteStoryMap,
  duplicateStoryMap,
  addSceneToMap,
  removeNodeFromMap,
  batchUpdateNodePositions,
  createMapEdge,
  updateMapEdge,
  deleteMapEdge,
  replaceSequenceEdges,
  batchUpdateNodeSequenceIndices,
  createMapGroup,
  updateMapGroup,
  deleteMapGroup,
  getMapWithDetails,
} from '@/db/queries/maps';
import {
  createMapSchema,
  updateMapSchema,
  duplicateMapSchema,
  addSceneToMapSchema,
  batchUpdateNodesSchema,
  createMapEdgeSchema,
  updateMapEdgeSchema,
  reorderSequenceSchema,
  createMapGroupSchema,
  updateMapGroupSchema,
  type CreateMapInput,
  type UpdateMapInput,
  type DuplicateMapInput,
  type AddSceneToMapInput,
  type BatchUpdateNodesInput,
  type CreateMapEdgeInput,
  type UpdateMapEdgeInput,
  type ReorderSequenceInput,
  type CreateMapGroupInput,
  type UpdateMapGroupInput,
} from '@/lib/validators/maps';
import { deriveSequence, rewireSequenceOrder } from '@/lib/sequence';
import type { ActionResponse } from './projects';
import type { StoryMap, MapNode, MapEdge, MapGroup } from '@/db/schema';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export async function createMapAction(
  projectId: string,
  data: CreateMapInput
): Promise<ActionResponse<StoryMap>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = createMapSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireProjectAccess(projectId, session.user.id);
    const map = await createStoryMap({ projectId, ...parsed.data });
    revalidatePath(`/projects/${projectId}/story-map`);
    return { success: true, data: map };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to create map') };
  }
}

export async function updateMapAction(
  mapId: string,
  data: UpdateMapInput
): Promise<ActionResponse<StoryMap>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = updateMapSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const updated = await updateStoryMap(mapId, parsed.data);
    if (!updated) return { success: false, error: 'Map not found' };
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update map') };
  }
}

export async function deleteMapAction(mapId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    if (map.isDefault) {
      return { success: false, error: 'Cannot delete the default story map' };
    }
    await deleteStoryMap(mapId);
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: { id: mapId } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to delete map') };
  }
}

export async function duplicateMapAction(
  mapId: string,
  data?: DuplicateMapInput
): Promise<ActionResponse<StoryMap>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  if (data) {
    const parsed = duplicateMapSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
    }
  }

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const duplicated = await duplicateStoryMap(mapId, data?.name);
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: duplicated };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to duplicate map') };
  }
}

export async function addSceneToMapAction(
  mapId: string,
  data: AddSceneToMapInput
): Promise<ActionResponse<MapNode>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = addSceneToMapSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const node = await addSceneToMap(mapId, parsed.data.sceneId, {
      x: parsed.data.x,
      y: parsed.data.y,
    });
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: node };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to place scene on map') };
  }
}

export async function removeNodeFromMapAction(
  mapId: string,
  nodeId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    await removeNodeFromMap(mapId, nodeId);

    // Recompute sequence indices after removing node
    const details = await getMapWithDetails(mapId);
    if (details) {
      const nodeIds = details.nodes.map((n) => n.id);
      const derivation = deriveSequence(nodeIds, details.edges);
      if (derivation.isValid) {
        await batchUpdateNodeSequenceIndices(mapId, derivation.sequenceIndices);
      }
    }

    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: { id: nodeId } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to remove node from map') };
  }
}

export async function batchUpdateNodePositionsAction(
  mapId: string,
  data: BatchUpdateNodesInput
): Promise<ActionResponse<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = batchUpdateNodesSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    await requireMapAccess(mapId, session.user.id);
    await batchUpdateNodePositions(mapId, parsed.data.updates);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update node positions') };
  }
}

export async function createMapEdgeAction(
  mapId: string,
  data: CreateMapEdgeInput
): Promise<ActionResponse<MapEdge>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = createMapEdgeSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const details = await getMapWithDetails(mapId);
    if (!details) return { success: false, error: 'Map not found' };

    // If edge is a sequence edge, validate against main-path acyclic constraint
    if (parsed.data.edgeType === 'sequence') {
      const candidateEdges = [
        ...details.edges,
        {
          sourceNodeId: parsed.data.sourceNodeId,
          targetNodeId: parsed.data.targetNodeId,
          edgeType: 'sequence',
        },
      ];
      const nodeIds = details.nodes.map((n) => n.id);
      const derivation = deriveSequence(nodeIds, candidateEdges);
      if (!derivation.isValid) {
        return { success: false, error: derivation.error || 'Invalid sequence edge' };
      }

      // Create edge
      const edge = await createMapEdge({ mapId, ...parsed.data });
      // Update sequence indices
      await batchUpdateNodeSequenceIndices(mapId, derivation.sequenceIndices);
      revalidatePath(`/projects/${map.projectId}/story-map`);
      return { success: true, data: edge };
    }

    // Annotation edges (branch, cause, setup_payoff)
    const edge = await createMapEdge({ mapId, ...parsed.data });
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: edge };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to create edge') };
  }
}

export async function updateMapEdgeAction(
  mapId: string,
  edgeId: string,
  data: UpdateMapEdgeInput
): Promise<ActionResponse<MapEdge>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = updateMapEdgeSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const updated = await updateMapEdge(edgeId, parsed.data);
    if (!updated) return { success: false, error: 'Edge not found' };
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update edge') };
  }
}

export async function deleteMapEdgeAction(
  mapId: string,
  edgeId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    await deleteMapEdge(edgeId);

    // Recompute sequence after edge removal
    const details = await getMapWithDetails(mapId);
    if (details) {
      const nodeIds = details.nodes.map((n) => n.id);
      const derivation = deriveSequence(nodeIds, details.edges);
      if (derivation.isValid) {
        await batchUpdateNodeSequenceIndices(mapId, derivation.sequenceIndices);
      }
    }

    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: { id: edgeId } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to delete edge') };
  }
}

export async function reorderSequenceAction(
  mapId: string,
  data: ReorderSequenceInput
): Promise<ActionResponse<{ sequenceMap: Record<string, number> }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = reorderSequenceSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const { newEdges, sequenceMap } = rewireSequenceOrder(parsed.data.orderedNodeIds);

    // Replace sequence edges and update indices
    await replaceSequenceEdges(mapId, newEdges);
    await batchUpdateNodeSequenceIndices(mapId, sequenceMap);

    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: { sequenceMap } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to reorder sequence') };
  }
}

export async function createMapGroupAction(
  mapId: string,
  data: CreateMapGroupInput
): Promise<ActionResponse<MapGroup>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = createMapGroupSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const group = await createMapGroup({ mapId, ...parsed.data });
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: group };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to create group') };
  }
}

export async function updateMapGroupAction(
  mapId: string,
  groupId: string,
  data: UpdateMapGroupInput
): Promise<ActionResponse<MapGroup>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const parsed = updateMapGroupSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Validation failed' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    const updated = await updateMapGroup(groupId, parsed.data);
    if (!updated) return { success: false, error: 'Group not found' };
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to update group') };
  }
}

export async function deleteMapGroupAction(
  mapId: string,
  groupId: string
): Promise<ActionResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    await deleteMapGroup(groupId);
    revalidatePath(`/projects/${map.projectId}/story-map`);
    return { success: true, data: { id: groupId } };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Failed to delete group') };
  }
}
