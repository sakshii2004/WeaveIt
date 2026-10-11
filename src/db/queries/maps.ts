import { eq, and, asc, desc } from 'drizzle-orm';
import { db } from '../index';
import {
  storyMaps,
  mapNodes,
  mapEdges,
  mapGroups,
  type StoryMap,
  type MapNode,
  type MapEdge,
  type MapGroup,
  type Chapter,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';
import { getSceneWithDetails, type SceneWithDetails } from './scenes';
import { listChaptersByProject } from './structure';

export interface MapNodeWithScene extends MapNode {
  scene: SceneWithDetails | null;
}

export interface StoryMapDetails {
  map: StoryMap;
  nodes: MapNodeWithScene[];
  edges: MapEdge[];
  groups: MapGroup[];
  chapters: Chapter[];
}

// In-memory fallback stores for test/offline stub mode
export const stubStoryMaps = new Map<string, StoryMap>();
export const stubMapNodes = new Map<string, MapNode>();
export const stubMapEdges = new Map<string, MapEdge>();
export const stubMapGroups = new Map<string, MapGroup>();

export function clearMapsStubsForTesting() {
  stubStoryMaps.clear();
  stubMapNodes.clear();
  stubMapEdges.clear();
  stubMapGroups.clear();
}

/* ==========================================================================
   STORY MAPS CRUD
   ========================================================================== */

export async function listStoryMapsByProject(projectId: string): Promise<StoryMap[]> {
  if (db) {
    return await db
      .select()
      .from(storyMaps)
      .where(eq(storyMaps.projectId, projectId))
      .orderBy(desc(storyMaps.isDefault), asc(storyMaps.createdAt));
  }
  return Array.from(stubStoryMaps.values())
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export async function findStoryMapById(id: string): Promise<StoryMap | null> {
  if (db) {
    const result = await db.select().from(storyMaps).where(eq(storyMaps.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubStoryMaps.get(id) ?? null;
}

export async function createStoryMap(data: {
  projectId: string;
  name?: string;
  kind?: string;
  isDefault?: boolean;
}): Promise<StoryMap> {
  const mapId = uuidv7();
  const now = new Date();

  const record: StoryMap = {
    id: mapId,
    projectId: data.projectId,
    name: data.name?.trim() || 'New Story Map',
    kind: data.kind || 'story',
    isDefault: data.isDefault ?? false,
    viewport: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(storyMaps).values(record).returning();
    return inserted;
  }

  stubStoryMaps.set(mapId, record);
  return record;
}

export async function updateStoryMap(
  id: string,
  data: {
    name?: string;
    viewport?: { x: number; y: number; zoom: number } | null;
    isDefault?: boolean;
  }
): Promise<StoryMap | null> {
  const existing = await findStoryMapById(id);
  if (!existing) return null;

  const now = new Date();
  const updateData: Partial<StoryMap> = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.viewport !== undefined ? { viewport: data.viewport } : {}),
    ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db
      .update(storyMaps)
      .set(updateData)
      .where(eq(storyMaps.id, id))
      .returning();
    return updated ?? null;
  }

  const updated: StoryMap = { ...existing, ...updateData };
  stubStoryMaps.set(id, updated);
  return updated;
}

export async function deleteStoryMap(id: string): Promise<boolean> {
  const existing = await findStoryMapById(id);
  if (!existing) return false;

  if (db) {
    await db.delete(storyMaps).where(eq(storyMaps.id, id));
    return true;
  }

  stubStoryMaps.delete(id);
  // Cascade in-memory stubs
  for (const [nodeId, node] of stubMapNodes.entries()) {
    if (node.mapId === id) stubMapNodes.delete(nodeId);
  }
  for (const [edgeId, edge] of stubMapEdges.entries()) {
    if (edge.mapId === id) stubMapEdges.delete(edgeId);
  }
  for (const [groupId, group] of stubMapGroups.entries()) {
    if (group.mapId === id) stubMapGroups.delete(groupId);
  }
  return true;
}

export async function duplicateStoryMap(
  sourceMapId: string,
  newName?: string
): Promise<StoryMap> {
  const sourceMap = await findStoryMapById(sourceMapId);
  if (!sourceMap) throw new Error('Source story map not found');

  const now = new Date();
  const newMapId = uuidv7();
  const finalName = newName?.trim() || `${sourceMap.name} (Copy)`;

  const newMapRecord: StoryMap = {
    id: newMapId,
    projectId: sourceMap.projectId,
    name: finalName,
    kind: sourceMap.kind,
    isDefault: false,
    viewport: sourceMap.viewport,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [clonedMap] = await db.insert(storyMaps).values(newMapRecord).returning();

    // 1. Clone groups
    const oldGroups = await db.select().from(mapGroups).where(eq(mapGroups.mapId, sourceMapId));
    const groupMapping = new Map<string, string>(); // oldId -> newId

    for (const og of oldGroups) {
      const newGId = uuidv7();
      groupMapping.set(og.id, newGId);
      await db.insert(mapGroups).values({
        ...og,
        id: newGId,
        mapId: newMapId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Clone nodes
    const oldNodes = await db.select().from(mapNodes).where(eq(mapNodes.mapId, sourceMapId));
    const nodeMapping = new Map<string, string>(); // oldId -> newId

    for (const on of oldNodes) {
      const newNId = uuidv7();
      nodeMapping.set(on.id, newNId);
      await db.insert(mapNodes).values({
        ...on,
        id: newNId,
        mapId: newMapId,
        groupId: on.groupId ? groupMapping.get(on.groupId) || null : null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Clone edges
    const oldEdges = await db.select().from(mapEdges).where(eq(mapEdges.mapId, sourceMapId));
    for (const oe of oldEdges) {
      const newSource = nodeMapping.get(oe.sourceNodeId);
      const newTarget = nodeMapping.get(oe.targetNodeId);
      if (newSource && newTarget) {
        await db.insert(mapEdges).values({
          id: uuidv7(),
          mapId: newMapId,
          sourceNodeId: newSource,
          targetNodeId: newTarget,
          edgeType: oe.edgeType,
          label: oe.label,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return clonedMap;
  }

  // In-memory stub duplication
  stubStoryMaps.set(newMapId, newMapRecord);

  const groupMapping = new Map<string, string>();
  for (const group of stubMapGroups.values()) {
    if (group.mapId === sourceMapId) {
      const newGId = uuidv7();
      groupMapping.set(group.id, newGId);
      stubMapGroups.set(newGId, {
        ...group,
        id: newGId,
        mapId: newMapId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const nodeMapping = new Map<string, string>();
  for (const node of stubMapNodes.values()) {
    if (node.mapId === sourceMapId) {
      const newNId = uuidv7();
      nodeMapping.set(node.id, newNId);
      stubMapNodes.set(newNId, {
        ...node,
        id: newNId,
        mapId: newMapId,
        groupId: node.groupId ? groupMapping.get(node.groupId) || null : null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  for (const edge of stubMapEdges.values()) {
    if (edge.mapId === sourceMapId) {
      const newSource = nodeMapping.get(edge.sourceNodeId);
      const newTarget = nodeMapping.get(edge.targetNodeId);
      if (newSource && newTarget) {
        const newEId = uuidv7();
        stubMapEdges.set(newEId, {
          id: newEId,
          mapId: newMapId,
          sourceNodeId: newSource,
          targetNodeId: newTarget,
          edgeType: edge.edgeType,
          label: edge.label,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return newMapRecord;
}

/* ==========================================================================
   GRAPH DETAILS QUERY
   ========================================================================== */

export async function getMapWithDetails(mapId: string): Promise<StoryMapDetails | null> {
  const map = await findStoryMapById(mapId);
  if (!map) return null;

  if (db) {
    const [nodeRows, edgeRows, groupRows, chaptersList] = await Promise.all([
      db.select().from(mapNodes).where(eq(mapNodes.mapId, mapId)),
      db.select().from(mapEdges).where(eq(mapEdges.mapId, mapId)),
      db.select().from(mapGroups).where(eq(mapGroups.mapId, mapId)),
      listChaptersByProject(map.projectId, mapId),
    ]);

    // Enrich nodes with full scene details
    const enrichedNodes: MapNodeWithScene[] = await Promise.all(
      nodeRows.map(async (n) => {
        let sceneDetails: SceneWithDetails | null = null;
        if (n.sceneId) {
          sceneDetails = await getSceneWithDetails(n.sceneId);
        }
        return {
          ...n,
          scene: sceneDetails,
        };
      })
    );

    return {
      map,
      nodes: enrichedNodes,
      edges: edgeRows,
      groups: groupRows,
      chapters: chaptersList,
    };
  }

  // In-memory stub enrichment
  const nodeRows = Array.from(stubMapNodes.values()).filter((n) => n.mapId === mapId);
  const edgeRows = Array.from(stubMapEdges.values()).filter((e) => e.mapId === mapId);
  const groupRows = Array.from(stubMapGroups.values()).filter((g) => g.mapId === mapId);
  const chaptersList = await listChaptersByProject(map.projectId, mapId);

  const enrichedNodes: MapNodeWithScene[] = await Promise.all(
    nodeRows.map(async (n) => {
      let sceneDetails: SceneWithDetails | null = null;
      if (n.sceneId) {
        sceneDetails = await getSceneWithDetails(n.sceneId);
      }
      return {
        ...n,
        scene: sceneDetails,
      };
    })
  );

  return {
    map,
    nodes: enrichedNodes,
    edges: edgeRows,
    groups: groupRows,
    chapters: chaptersList,
  };
}

/* ==========================================================================
   NODES & POSITION PERSISTENCE
   ========================================================================== */

export async function addSceneToMap(
  mapId: string,
  sceneId: string,
  position: { x: number; y: number } = { x: 100, y: 100 }
): Promise<MapNode> {
  const map = await findStoryMapById(mapId);
  if (!map) throw new Error('Story Map not found');

  // Check if node already exists for this scene in this map
  if (db) {
    const existing = await db
      .select()
      .from(mapNodes)
      .where(and(eq(mapNodes.mapId, mapId), eq(mapNodes.sceneId, sceneId)))
      .limit(1);

    if (existing[0]) return existing[0];

    const nodeId = uuidv7();
    const now = new Date();
    const [inserted] = await db
      .insert(mapNodes)
      .values({
        id: nodeId,
        mapId,
        sceneId,
        characterId: null,
        x: position.x,
        y: position.y,
        width: 280,
        height: 170,
        groupId: null,
        chapterId: null,
        sequenceIndex: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return inserted;
  }

  // Stub fallback
  for (const node of stubMapNodes.values()) {
    if (node.mapId === mapId && node.sceneId === sceneId) {
      return node;
    }
  }

  const nodeId = uuidv7();
  const now = new Date();
  const record: MapNode = {
    id: nodeId,
    mapId,
    sceneId,
    characterId: null,
    x: position.x,
    y: position.y,
    width: 280,
    height: 170,
    groupId: null,
    chapterId: null,
    sequenceIndex: null,
    createdAt: now,
    updatedAt: now,
  };
  stubMapNodes.set(nodeId, record);
  return record;
}

export async function removeNodeFromMap(mapId: string, nodeId: string): Promise<void> {
  if (db) {
    // Delete edges referencing this node first
    await db
      .delete(mapEdges)
      .where(
        and(
          eq(mapEdges.mapId, mapId),
          eq(mapEdges.sourceNodeId, nodeId)
        )
      );
    await db
      .delete(mapEdges)
      .where(
        and(
          eq(mapEdges.mapId, mapId),
          eq(mapEdges.targetNodeId, nodeId)
        )
      );
    // Delete node
    await db.delete(mapNodes).where(and(eq(mapNodes.mapId, mapId), eq(mapNodes.id, nodeId)));
    return;
  }

  stubMapNodes.delete(nodeId);
  for (const [eId, edge] of stubMapEdges.entries()) {
    if (edge.mapId === mapId && (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId)) {
      stubMapEdges.delete(eId);
    }
  }
}

export async function batchUpdateNodePositions(
  mapId: string,
  updates: { id: string; x: number; y: number; width?: number | null; height?: number | null }[]
): Promise<void> {
  const now = new Date();

  if (db) {
    const database = db;
    await Promise.all(
      updates.map((u) =>
        database
          .update(mapNodes)
          .set({
            x: u.x,
            y: u.y,
            ...(u.width !== undefined ? { width: u.width } : {}),
            ...(u.height !== undefined ? { height: u.height } : {}),
            updatedAt: now,
          })
          .where(and(eq(mapNodes.mapId, mapId), eq(mapNodes.id, u.id)))
      )
    );
    return;
  }

  for (const u of updates) {
    const existing = stubMapNodes.get(u.id);
    if (existing && existing.mapId === mapId) {
      stubMapNodes.set(u.id, {
        ...existing,
        x: u.x,
        y: u.y,
        ...(u.width !== undefined ? { width: u.width } : {}),
        ...(u.height !== undefined ? { height: u.height } : {}),
        updatedAt: now,
      });
    }
  }
}

export async function updateMapNode(
  nodeId: string,
  data: {
    chapterId?: string | null;
    groupId?: string | null;
    sequenceIndex?: number | null;
  }
): Promise<MapNode | null> {
  const now = new Date();

  if (db) {
    const [updated] = await db
      .update(mapNodes)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(mapNodes.id, nodeId))
      .returning();
    return updated ?? null;
  }

  const existing = stubMapNodes.get(nodeId);
  if (!existing) return null;
  const updated = { ...existing, ...data, updatedAt: now };
  stubMapNodes.set(nodeId, updated);
  return updated;
}

export async function batchUpdateNodeSequenceIndices(
  mapId: string,
  sequenceMap: Record<string, number | null>
): Promise<void> {
  const now = new Date();

  if (db) {
    const database = db;
    await Promise.all(
      Object.entries(sequenceMap).map(([nodeId, index]) =>
        database
          .update(mapNodes)
          .set({ sequenceIndex: index, updatedAt: now })
          .where(and(eq(mapNodes.mapId, mapId), eq(mapNodes.id, nodeId)))
      )
    );
    return;
  }

  for (const [nodeId, index] of Object.entries(sequenceMap)) {
    const existing = stubMapNodes.get(nodeId);
    if (existing && existing.mapId === mapId) {
      stubMapNodes.set(nodeId, { ...existing, sequenceIndex: index, updatedAt: now });
    }
  }
}

/* ==========================================================================
   EDGES OPERATIONS
   ========================================================================== */

export async function createMapEdge(data: {
  mapId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType?: string;
  label?: string | null;
}): Promise<MapEdge> {
  const edgeId = uuidv7();
  const now = new Date();

  const record: MapEdge = {
    id: edgeId,
    mapId: data.mapId,
    sourceNodeId: data.sourceNodeId,
    targetNodeId: data.targetNodeId,
    edgeType: data.edgeType || 'sequence',
    label: data.label?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(mapEdges).values(record).returning();
    return inserted;
  }

  stubMapEdges.set(edgeId, record);
  return record;
}

export async function updateMapEdge(
  edgeId: string,
  data: { edgeType?: string; label?: string | null }
): Promise<MapEdge | null> {
  const now = new Date();
  const updateData: Partial<MapEdge> = {
    ...(data.edgeType !== undefined ? { edgeType: data.edgeType } : {}),
    ...(data.label !== undefined ? { label: data.label?.trim() || null } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db
      .update(mapEdges)
      .set(updateData)
      .where(eq(mapEdges.id, edgeId))
      .returning();
    return updated ?? null;
  }

  const existing = stubMapEdges.get(edgeId);
  if (!existing) return null;
  const updated = { ...existing, ...updateData };
  stubMapEdges.set(edgeId, updated);
  return updated;
}

export async function deleteMapEdge(edgeId: string): Promise<boolean> {
  if (db) {
    await db.delete(mapEdges).where(eq(mapEdges.id, edgeId));
    return true;
  }
  return stubMapEdges.delete(edgeId);
}

export async function replaceSequenceEdges(
  mapId: string,
  newSequencePairs: { sourceNodeId: string; targetNodeId: string }[]
): Promise<void> {
  const now = new Date();

  if (db) {
    // Delete existing sequence edges
    await db
      .delete(mapEdges)
      .where(and(eq(mapEdges.mapId, mapId), eq(mapEdges.edgeType, 'sequence')));

    if (newSequencePairs.length > 0) {
      await db.insert(mapEdges).values(
        newSequencePairs.map((pair) => ({
          id: uuidv7(),
          mapId,
          sourceNodeId: pair.sourceNodeId,
          targetNodeId: pair.targetNodeId,
          edgeType: 'sequence',
          label: null,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
    return;
  }

  // In-memory stub
  for (const [id, edge] of Array.from(stubMapEdges.entries())) {
    if (edge.mapId === mapId && edge.edgeType === 'sequence') {
      stubMapEdges.delete(id);
    }
  }

  for (const pair of newSequencePairs) {
    const id = uuidv7();
    stubMapEdges.set(id, {
      id,
      mapId,
      sourceNodeId: pair.sourceNodeId,
      targetNodeId: pair.targetNodeId,
      edgeType: 'sequence',
      label: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/* ==========================================================================
   GROUPS OPERATIONS
   ========================================================================== */

export async function createMapGroup(data: {
  mapId: string;
  label: string;
  color?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}): Promise<MapGroup> {
  const groupId = uuidv7();
  const now = new Date();

  const record: MapGroup = {
    id: groupId,
    mapId: data.mapId,
    label: data.label.trim(),
    color: data.color || 'slate',
    x: data.x,
    y: data.y,
    width: data.width ?? 400,
    height: data.height ?? 300,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(mapGroups).values(record).returning();
    return inserted;
  }

  stubMapGroups.set(groupId, record);
  return record;
}

export async function updateMapGroup(
  groupId: string,
  data: {
    label?: string;
    color?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
): Promise<MapGroup | null> {
  const now = new Date();
  const updateData: Partial<MapGroup> = {
    ...(data.label !== undefined ? { label: data.label.trim() } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(data.x !== undefined ? { x: data.x } : {}),
    ...(data.y !== undefined ? { y: data.y } : {}),
    ...(data.width !== undefined ? { width: data.width } : {}),
    ...(data.height !== undefined ? { height: data.height } : {}),
    updatedAt: now,
  };

  if (db) {
    const [updated] = await db
      .update(mapGroups)
      .set(updateData)
      .where(eq(mapGroups.id, groupId))
      .returning();
    return updated ?? null;
  }

  const existing = stubMapGroups.get(groupId);
  if (!existing) return null;
  const updated = { ...existing, ...updateData };
  stubMapGroups.set(groupId, updated);
  return updated;
}

export async function deleteMapGroup(groupId: string): Promise<boolean> {
  if (db) {
    // Unassign nodes from this group
    await db
      .update(mapNodes)
      .set({ groupId: null })
      .where(eq(mapNodes.groupId, groupId));
    await db.delete(mapGroups).where(eq(mapGroups.id, groupId));
    return true;
  }

  for (const node of stubMapNodes.values()) {
    if (node.groupId === groupId) {
      stubMapNodes.set(node.id, { ...node, groupId: null });
    }
  }
  return stubMapGroups.delete(groupId);
}
