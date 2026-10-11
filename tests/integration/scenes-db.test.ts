import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import { createProjectWithDefaults } from '@/db/queries/projects';
import { createCharacter } from '@/db/queries/characters';
import {
  createScene,
  findSceneById,
  listScenesByProject,
  listDeletedScenesByProject,
  updateScene,
  softDeleteScene,
  restoreScene,
  permanentDeleteScene,
} from '@/db/queries/scenes';
import { createAct, createThread, createChapter, createLocation } from '@/db/queries/structure';
import { db } from '@/db';

describe('Scenes Database Operations (Neon Postgres / Query Layer)', () => {
  const testEmail = `scene_tester_${Date.now()}@weaveit.test`;
  let testUserId: string;
  let testProjectId: string;
  let testCharId: string;
  let testThreadId: string;
  let testActId: string;
  let testChapterId: string;
  let testLocationId: string;

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
      title: 'Midnight Express at Jaipur',
      genre: 'Mystery',
    });
    testProjectId = project.id;

    const char = await createCharacter({
      projectId: testProjectId,
      name: 'Inspector Arjun',
      role: 'protagonist',
    });
    testCharId = char.id;

    const thread = await createThread({
      projectId: testProjectId,
      name: 'The Stolen Ledger',
      color: 'coral',
    });
    testThreadId = thread.id;

    const act = await createAct({
      projectId: testProjectId,
      name: 'Act I: The Arrival',
      color: 'teal',
    });
    testActId = act.id;

    const chapter = await createChapter({
      projectId: testProjectId,
      title: 'Chapter 01: Platform 3',
    });
    testChapterId = chapter.id;

    const location = await createLocation({
      projectId: testProjectId,
      name: 'Jaipur Railway Station',
    });
    testLocationId = location.id;
  });

  it('creates scene with single sentence auto-titling per PRD §7.3', async () => {
    const scene = await createScene({
      projectId: testProjectId,
      description: 'Steam hisses across Platform 3 as the midnight express arrives from Delhi.',
    });

    expect(scene.id).toBeTruthy();
    expect(scene.title).toBeTruthy();
    expect(scene.title).toContain('Steam hisses across Platform 3');
    expect(scene.status).toBe('seed');
  });

  it('creates scene with explicit title, relations, act, chapter, location', async () => {
    const scene = await createScene({
      projectId: testProjectId,
      title: 'Arjun confronts the station master',
      status: 'planned',
      actId: testActId,
      chapterId: testChapterId,
      locationId: testLocationId,
      characters: [{ characterId: testCharId, roleInScene: 'Demands logbook' }],
      threadIds: [testThreadId],
    });

    expect(scene.title).toBe('Arjun confronts the station master');
    expect(scene.characters.length).toBe(1);
    expect(scene.characters[0].character.name).toBe('Inspector Arjun');
    expect(scene.characters[0].roleInScene).toBe('Demands logbook');
    expect(scene.threads.length).toBe(1);
    expect(scene.threads[0].name).toBe('The Stolen Ledger');
    expect(scene.act?.name).toBe('Act I: The Arrival');
    expect(scene.chapter?.title).toBe('Chapter 01: Platform 3');
    expect(scene.location?.name).toBe('Jaipur Railway Station');
  });

  it('filters scenes by status, act, and search query', async () => {
    const all = await listScenesByProject(testProjectId);
    expect(all.length).toBeGreaterThanOrEqual(2);

    const plannedOnly = await listScenesByProject(testProjectId, { status: 'planned' });
    expect(plannedOnly.every((s) => s.status === 'planned')).toBe(true);

    const searchMatch = await listScenesByProject(testProjectId, { search: 'confronts' });
    expect(searchMatch.length).toBe(1);
    expect(searchMatch[0].title).toBe('Arjun confronts the station master');
  });

  it('updates scene fields and relational joins', async () => {
    const created = await createScene({
      projectId: testProjectId,
      title: 'A quiet conversation in the tea stall',
      status: 'seed',
    });

    const updated = await updateScene(created.id, {
      title: 'A quiet conversation in the chai stall',
      status: 'sketched',
      purpose: 'Arjun discovers the forged ticket.',
      characters: [{ characterId: testCharId, roleInScene: 'Listens closely' }],
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('A quiet conversation in the chai stall');
    expect(updated?.status).toBe('sketched');
    expect(updated?.purpose).toBe('Arjun discovers the forged ticket.');
    expect(updated?.characters[0].roleInScene).toBe('Listens closely');
  });

  it('handles soft delete, listing deleted scenes, and restore', async () => {
    const scene = await createScene({
      projectId: testProjectId,
      title: 'Temporary draft scene to delete',
    });

    await softDeleteScene(scene.id);

    const activeList = await listScenesByProject(testProjectId);
    expect(activeList.some((s) => s.id === scene.id)).toBe(false);

    const deletedList = await listDeletedScenesByProject(testProjectId);
    expect(deletedList.some((s) => s.id === scene.id)).toBe(true);

    await restoreScene(scene.id);
    const restored = await findSceneById(scene.id);
    expect(restored?.deletedAt).toBeNull();
  });

  it('handles permanent deletion', async () => {
    const scene = await createScene({
      projectId: testProjectId,
      title: 'Scene for permanent erase',
    });

    await permanentDeleteScene(scene.id);
    const found = await findSceneById(scene.id);
    expect(found).toBeNull();
  });
});
