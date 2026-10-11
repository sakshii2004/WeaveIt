import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import { createProjectWithDefaults } from '@/db/queries/projects';
import {
  createAct,
  listActsByProject,
  updateAct,
  deleteAct,
  reorderActs,
  createChapter,
  listChaptersByProject,
  updateChapter,
  deleteChapter,
  reorderChapters,
  createLocation,
  listLocationsByProject,
  updateLocation,
  deleteLocation,
  createThread,
  listThreadsByProject,
  updateThread,
  deleteThread,
} from '@/db/queries/structure';
import { db } from '@/db';

describe('Structure Database Operations (Neon Postgres / Query Layer)', () => {
  const testEmail = `structure_tester_${Date.now()}@weaveit.test`;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
    const user = await createUser({
      name: 'Author Maya',
      email: testEmail,
      passwordHash: 'hashed_password',
    });
    testUserId = user.id;

    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Echoes of the Thar Desert',
      genre: 'Historical Thriller',
    });
    testProjectId = project.id;
  });

  describe('Acts CRUD & Reorder', () => {
    it('creates, lists, updates, and reorders acts', async () => {
      const act1 = await createAct({
        projectId: testProjectId,
        name: 'Prologue: Before the Sandstorm',
        color: 'sun',
        orderIndex: 0,
      });

      const act2 = await createAct({
        projectId: testProjectId,
        name: 'Epilogue: Clearing Skies',
        color: 'sky',
        orderIndex: 1,
      });

      const actsList = await listActsByProject(testProjectId);
      expect(actsList.some((a) => a.id === act1.id)).toBe(true);
      expect(actsList.some((a) => a.id === act2.id)).toBe(true);

      const updated = await updateAct(act1.id, { name: 'Prologue: The Storm Rising' });
      expect(updated?.name).toBe('Prologue: The Storm Rising');

      // Reorder
      await reorderActs(testProjectId, [act2.id, act1.id]);
      const reordered = await listActsByProject(testProjectId);
      const idx2 = reordered.findIndex((a) => a.id === act2.id);
      const idx1 = reordered.findIndex((a) => a.id === act1.id);
      expect(idx2).toBeLessThan(idx1);

      // Delete
      await deleteAct(act1.id);
      const afterDelete = await listActsByProject(testProjectId);
      expect(afterDelete.some((a) => a.id === act1.id)).toBe(false);
    });
  });

  describe('Chapters CRUD & Reorder', () => {
    it('creates, lists, updates, and reorders chapters', async () => {
      const ch1 = await createChapter({
        projectId: testProjectId,
        title: 'Chapter 01: The Old Caravanserai',
      });

      const ch2 = await createChapter({
        projectId: testProjectId,
        title: 'Chapter 02: Under the Desert Sun',
      });

      const list = await listChaptersByProject(testProjectId);
      expect(list.some((c) => c.id === ch1.id)).toBe(true);

      const updated = await updateChapter(ch1.id, { title: 'Chapter 01: The Caravanserai' });
      expect(updated?.title).toBe('Chapter 01: The Caravanserai');

      await reorderChapters(testProjectId, [ch2.id, ch1.id]);
      const reordered = await listChaptersByProject(testProjectId);
      expect(reordered[0].id).toBe(ch2.id);

      await deleteChapter(ch1.id);
      const afterDelete = await listChaptersByProject(testProjectId);
      expect(afterDelete.some((c) => c.id === ch1.id)).toBe(false);
    });
  });

  describe('Locations CRUD', () => {
    it('creates, lists, updates, and deletes locations', async () => {
      const loc = await createLocation({
        projectId: testProjectId,
        name: 'Jaisalmer Fort Ramparts',
        description: 'Golden stone walls overlooking the golden city.',
      });

      const list = await listLocationsByProject(testProjectId);
      expect(list.some((l) => l.id === loc.id)).toBe(true);

      const updated = await updateLocation(loc.id, { name: 'Jaisalmer Fort West Bastion' });
      expect(updated?.name).toBe('Jaisalmer Fort West Bastion');

      await deleteLocation(loc.id);
      const afterDelete = await listLocationsByProject(testProjectId);
      expect(afterDelete.some((l) => l.id === loc.id)).toBe(false);
    });
  });

  describe('Threads CRUD', () => {
    it('creates, lists, updates, and deletes threads', async () => {
      const thread = await createThread({
        projectId: testProjectId,
        name: 'The Stolen Artifact',
        color: 'coral',
        description: 'A missing bronze statue from the 12th century.',
      });

      const list = await listThreadsByProject(testProjectId);
      expect(list.some((t) => t.id === thread.id)).toBe(true);

      const updated = await updateThread(thread.id, { name: 'The Lost Bronze Deity', color: 'sun' });
      expect(updated?.name).toBe('The Lost Bronze Deity');
      expect(updated?.color).toBe('sun');

      await deleteThread(thread.id);
      const afterDelete = await listThreadsByProject(testProjectId);
      expect(afterDelete.some((t) => t.id === thread.id)).toBe(false);
    });
  });
});
