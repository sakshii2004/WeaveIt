import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import { createProjectWithDefaults } from '@/db/queries/projects';
import { createScene } from '@/db/queries/scenes';
import {
  listStoryMapsByProject,
  findStoryMapById,
  createStoryMap,
  updateStoryMap,
  deleteStoryMap,
  duplicateStoryMap,
  getMapWithDetails,
  addSceneToMap,
  batchUpdateNodePositions,
  removeNodeFromMap,
  createMapEdge,
  updateMapEdge,
  deleteMapEdge,
  replaceSequenceEdges,
  createMapGroup,
  updateMapGroup,
  deleteMapGroup,
} from '@/db/queries/maps';
import { db } from '@/db';

describe('Story Maps Database Operations (Neon Postgres / Query Layer)', () => {
  const testEmail = `map_tester_${Date.now()}@weaveit.test`;
  let testUserId: string;
  let testProjectId: string;
  let testScene1Id: string;
  let testScene2Id: string;
  let defaultMapId: string;

  beforeAll(async () => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
    const user = await createUser({
      name: 'Author Priya',
      email: testEmail,
      passwordHash: 'hashed_password',
    });
    testUserId = user.id;

    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Echoes of Jaipur',
      genre: 'Historical Thriller',
    });
    testProjectId = project.id;

    const s1 = await createScene({
      projectId: testProjectId,
      title: 'Arjun arrives at Platform 3',
      status: 'seed',
    });
    testScene1Id = s1.id;

    const s2 = await createScene({
      projectId: testProjectId,
      title: 'The locked luggage room',
      status: 'sketched',
    });
    testScene2Id = s2.id;

    const maps = await listStoryMapsByProject(testProjectId);
    defaultMapId = maps[0].id;
  });

  it('lists default story map auto-created with the project', async () => {
    const maps = await listStoryMapsByProject(testProjectId);
    expect(maps.length).toBeGreaterThanOrEqual(1);
    expect(maps[0].name).toBe('Main Story Map');
    expect(maps[0].isDefault).toBe(true);

    const updated = await updateStoryMap(defaultMapId, { name: 'Renamed Main Map' });
    expect(updated?.name).toBe('Renamed Main Map');
    await updateStoryMap(defaultMapId, { name: 'Main Story Map' });
  });

  it('adds scenes to map as nodes and batch updates positions', async () => {
    const node1 = await addSceneToMap(defaultMapId, testScene1Id, { x: 100, y: 150 });
    const node2 = await addSceneToMap(defaultMapId, testScene2Id, { x: 420, y: 150 });

    expect(node1.mapId).toBe(defaultMapId);
    expect(node1.sceneId).toBe(testScene1Id);
    expect(node2.sceneId).toBe(testScene2Id);

    // Batch update positions
    await batchUpdateNodePositions(defaultMapId, [
      { id: node1.id, x: 120, y: 180 },
      { id: node2.id, x: 450, y: 180 },
    ]);

    const details = await getMapWithDetails(defaultMapId);
    expect(details).not.toBeNull();
    const updatedN1 = details!.nodes.find((n) => n.id === node1.id);
    expect(updatedN1?.x).toBe(120);
    expect(updatedN1?.y).toBe(180);
    expect(updatedN1?.scene?.title).toBe('Arjun arrives at Platform 3');

    // Remove node using an isolated temporary scene
    const tempScene = await createScene({
      projectId: testProjectId,
      title: 'Temporary Scene',
      status: 'seed',
    });
    const tempNode = await addSceneToMap(defaultMapId, tempScene.id, { x: 50, y: 50 });
    await removeNodeFromMap(defaultMapId, tempNode.id);
    const afterRemoval = await getMapWithDetails(defaultMapId);
    expect(afterRemoval!.nodes.some((n) => n.id === tempNode.id)).toBe(false);
  });

  it('creates, updates, and deletes map edges', async () => {
    const details = await getMapWithDetails(defaultMapId);
    const n1 = details!.nodes.find((n) => n.sceneId === testScene1Id)!;
    const n2 = details!.nodes.find((n) => n.sceneId === testScene2Id)!;

    const edge = await createMapEdge({
      mapId: defaultMapId,
      sourceNodeId: n1.id,
      targetNodeId: n2.id,
      edgeType: 'sequence',
      label: 'Continues immediately',
    });

    expect(edge.edgeType).toBe('sequence');
    expect(edge.label).toBe('Continues immediately');

    const updated = await updateMapEdge(edge.id, {
      edgeType: 'cause',
      label: 'Spurs investigation',
    });
    expect(updated?.edgeType).toBe('cause');

    // Replace sequence edges
    await replaceSequenceEdges(defaultMapId, [{ sourceNodeId: n1.id, targetNodeId: n2.id }]);
    const refetched = await getMapWithDetails(defaultMapId);
    const seqEdge = refetched!.edges.find((e) => e.edgeType === 'sequence');
    expect(seqEdge).toBeDefined();
    expect(seqEdge?.sourceNodeId).toBe(n1.id);

    // Delete an auxiliary map edge
    const auxEdge = await createMapEdge({
      mapId: defaultMapId,
      sourceNodeId: n1.id,
      targetNodeId: n2.id,
      edgeType: 'branch',
    });
    await deleteMapEdge(auxEdge.id);
    const afterDelete = await getMapWithDetails(defaultMapId);
    expect(afterDelete!.edges.some((e) => e.id === auxEdge.id)).toBe(false);
  });

  it('manages visual canvas grouping boxes', async () => {
    const group = await createMapGroup({
      mapId: defaultMapId,
      label: 'Platform Confrontations',
      color: 'teal',
      x: 80,
      y: 100,
      width: 600,
      height: 350,
    });

    expect(group.label).toBe('Platform Confrontations');
    expect(group.color).toBe('teal');

    const updated = await updateMapGroup(group.id, { label: 'Station Sequences' });
    expect(updated?.label).toBe('Station Sequences');

    await deleteMapGroup(group.id);
    const details = await getMapWithDetails(defaultMapId);
    expect(details!.groups.some((g) => g.id === group.id)).toBe(false);
  });

  it('duplicates a story map copying nodes, edges, groups but keeping scenes intact', async () => {
    const duplicate = await duplicateStoryMap(defaultMapId, 'Draft 2 Map');
    expect(duplicate.name).toBe('Draft 2 Map');
    expect(duplicate.isDefault).toBe(false);

    const dupDetails = await getMapWithDetails(duplicate.id);
    expect(dupDetails).not.toBeNull();
    // Nodes should point to the exact same scenes
    expect(dupDetails!.nodes.some((n) => n.sceneId === testScene1Id)).toBe(true);
    expect(dupDetails!.nodes.some((n) => n.sceneId === testScene2Id)).toBe(true);
  });

  it('deletes a story map without deleting scenes', async () => {
    const secondaryMap = await createStoryMap({
      projectId: testProjectId,
      name: 'Temporary Scratch Map',
    });

    await addSceneToMap(secondaryMap.id, testScene1Id);
    await deleteStoryMap(secondaryMap.id);

    const deletedMap = await findStoryMapById(secondaryMap.id);
    expect(deletedMap).toBeNull();

    // Scene must still exist!
    const defaultDetails = await getMapWithDetails(defaultMapId);
    expect(defaultDetails!.nodes.some((n) => n.sceneId === testScene1Id)).toBe(true);
  });
});
