import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import {
  createProjectWithDefaults,
  findProjectById,
  listProjectsByUser,
  listRecentlyDeletedProjects,
  updateProject,
  softDeleteProject,
  restoreProject,
  permanentDeleteProject,
  createSeedScene,
  listRecentScenes,
  listProjectActs,
  getDefaultStoryMap,
} from '@/db/queries/projects';
import { db } from '@/db';

describe('Projects & Dashboard Operations (Neon Postgres / DB Queries)', () => {
  const testEmail = `proj_tester_${Date.now()}@weaveit.test`;
  let testUserId: string;

  beforeAll(async () => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
    const user = await createUser({
      name: 'Author Maya',
      email: testEmail,
      passwordHash: 'passwordhash',
    });
    testUserId = user.id;
  });

  it('creates project and auto-seeds 3 acts and 1 default story map per PRD §7.1, §7.4', async () => {
    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'The Jaipur Connection',
      genre: 'Mystery / Thriller',
      logline: 'An investigator returns when a train arrives empty at the station.',
    });

    expect(project.id).toBeDefined();
    expect(project.title).toBe('The Jaipur Connection');
    expect(project.genre).toBe('Mystery / Thriller');
    expect(project.deletedAt).toBeNull();

    // Verify 3 acts were seeded automatically
    const acts = await listProjectActs(project.id);
    expect(acts).toHaveLength(3);
    expect(acts[0].name).toBe('Act I: Setup');
    expect(acts[0].color).toBe('teal');
    expect(acts[0].orderIndex).toBe(0);

    expect(acts[1].name).toBe('Act II: Confrontation');
    expect(acts[1].color).toBe('sun');
    expect(acts[1].orderIndex).toBe(1);

    expect(acts[2].name).toBe('Act III: Resolution');
    expect(acts[2].color).toBe('lavender');
    expect(acts[2].orderIndex).toBe(2);

    // Verify default story map was created
    const defaultMap = await getDefaultStoryMap(project.id);
    expect(defaultMap).not.toBeNull();
    expect(defaultMap?.name).toBe('Main Story Map');
    expect(defaultMap?.kind).toBe('story');
    expect(defaultMap?.isDefault).toBe(true);

    // Verify updating project details
    const updated = await updateProject(project.id, {
      title: 'The Jaipur Connection: Revised',
      genre: 'Historical Thriller',
    });
    expect(updated.title).toBe('The Jaipur Connection: Revised');
    expect(updated.genre).toBe('Historical Thriller');
  });

  it('creates a seed scene stub and updates sceneCount per PRD §8.2', async () => {
    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Scene Test Novel',
    });

    // Initial scene count should be 0
    let userProjects = await listProjectsByUser(testUserId);
    let current = userProjects.find((p) => p.id === project.id);
    expect(current?.sceneCount).toBe(0);

    // Quick add scene stub
    const scene = await createSeedScene(
      project.id,
      'She runs into him at the Jaipur railway station'
    );

    expect(scene.id).toBeDefined();
    expect(scene.title).toBe('She runs into him at the Jaipur railway station');
    expect(scene.status).toBe('seed');
    expect(scene.projectId).toBe(project.id);

    // Verify scenes listed
    const recentScenes = await listRecentScenes(project.id);
    expect(recentScenes).toHaveLength(1);
    expect(recentScenes[0].title).toBe('She runs into him at the Jaipur railway station');

    // Verify scene count in listProjectsByUser is now 1
    userProjects = await listProjectsByUser(testUserId);
    current = userProjects.find((p) => p.id === project.id);
    expect(current?.sceneCount).toBe(1);
  });

  it('handles soft-delete and restore lifecycle per PRD §6 and §8.2', async () => {
    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Novel to Delete',
    });

    // Soft delete
    await softDeleteProject(project.id);

    // Should NOT appear in active list
    const activeProjects = await listProjectsByUser(testUserId);
    expect(activeProjects.some((p) => p.id === project.id)).toBe(false);

    // SHOULD appear in recently deleted list
    const deletedProjects = await listRecentlyDeletedProjects(testUserId);
    expect(deletedProjects.some((p) => p.id === project.id)).toBe(true);

    // Restore
    await restoreProject(project.id);

    // Should be back in active list
    const restoredProjects = await listProjectsByUser(testUserId);
    expect(restoredProjects.some((p) => p.id === project.id)).toBe(true);
  });

  it('permanently deletes project and cleans up', async () => {
    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Permanent Deletion Target',
    });

    await createSeedScene(project.id, 'A temporary scene');

    await permanentDeleteProject(project.id);

    const check = await findProjectById(project.id);
    expect(check).toBeNull();

    const acts = await listProjectActs(project.id);
    expect(acts).toHaveLength(0);

    const scenes = await listRecentScenes(project.id);
    expect(scenes).toHaveLength(0);
  });
});
