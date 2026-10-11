import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import { createProjectWithDefaults } from '@/db/queries/projects';
import { createCharacter } from '@/db/queries/characters';
import { createScene, permanentDeleteScene } from '@/db/queries/scenes';
import {
  findScenePlayBySceneId,
  upsertScenePlay,
  deleteScenePlay,
} from '@/db/queries/play';
import { db } from '@/db';
import { v7 as uuidv7 } from 'uuid';

describe('Scene Plays Database Operations (PRD §7.3, §8.6)', () => {
  let testUserId: string;
  let testProjectId: string;
  let testSceneId: string;
  let testCharId: string;

  beforeAll(async () => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
    const user = await createUser({
      name: 'Scriptwriter Dev',
      email: `play_tester_${Date.now()}@weaveit.test`,
      passwordHash: 'hashed_password',
    });
    testUserId = user.id;

    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Midnight in Jaipur',
      genre: 'Mystery',
    });
    testProjectId = project.id;

    const character = await createCharacter({
      projectId: testProjectId,
      name: 'Inspector Arjun',
      role: 'protagonist',
    });
    testCharId = character.id;

    const scene = await createScene({
      projectId: testProjectId,
      title: 'Confrontation at Platform 3',
      description: 'Arjun corners the courier by the luggage wagon.',
    });
    testSceneId = scene.id;
  });

  it('returns null when no play exists for a scene', async () => {
    const play = await findScenePlayBySceneId(testSceneId);
    expect(play).toBeNull();
  });

  it('creates new scene play with beats and purpose note', async () => {
    const beat1 = {
      id: uuidv7(),
      type: 'action' as const,
      text: 'Steam hisses from the locomotive piston.',
    };
    const beat2 = {
      id: uuidv7(),
      type: 'dialogue' as const,
      characterId: testCharId,
      text: 'You drop that valise, or neither of us catches the midnight train.',
    };
    const beat3 = {
      id: uuidv7(),
      type: 'direction' as const,
      text: '(clicking safety off)',
    };

    const saved = await upsertScenePlay(testSceneId, {
      content: [beat1, beat2, beat3],
      purposeNote: 'Arjun proves the courier was carrying counterfeit banknotes.',
    });

    expect(saved).toBeDefined();
    expect(saved.sceneId).toBe(testSceneId);
    expect(saved.content).toHaveLength(3);
    expect(saved.purposeNote).toBe(
      'Arjun proves the courier was carrying counterfeit banknotes.'
    );

    const fetched = await findScenePlayBySceneId(testSceneId);
    expect(fetched).not.toBeNull();
    expect(fetched!.content).toHaveLength(3);
    expect(fetched!.content[1].text).toContain('You drop that valise');
  });

  it('updates existing scene play on subsequent upsert', async () => {
    const newBeat = {
      id: uuidv7(),
      type: 'narrator_note' as const,
      text: 'Rain begins drumming on the tin roof.',
    };

    const updated = await upsertScenePlay(testSceneId, {
      content: [newBeat],
      purposeNote: 'Updated dramatic realization.',
    });

    expect(updated.content).toHaveLength(1);
    expect(updated.purposeNote).toBe('Updated dramatic realization.');

    const fetched = await findScenePlayBySceneId(testSceneId);
    expect(fetched).not.toBeNull();
    expect(fetched!.content).toHaveLength(1);
    expect(fetched!.content[0].type).toBe('narrator_note');
  });

  it('deletes play directly via deleteScenePlay', async () => {
    const tempScene = await createScene({
      projectId: testProjectId,
      title: 'Temporary Scene',
    });

    await upsertScenePlay(tempScene.id, {
      content: [{ id: uuidv7(), type: 'action', text: 'Quick moment' }],
    });

    expect(await findScenePlayBySceneId(tempScene.id)).not.toBeNull();

    await deleteScenePlay(tempScene.id);
    expect(await findScenePlayBySceneId(tempScene.id)).toBeNull();
  });

  it('cleans up play on permanent scene deletion', async () => {
    const sceneToDelete = await createScene({
      projectId: testProjectId,
      title: 'Scene to be permanently deleted',
    });

    await upsertScenePlay(sceneToDelete.id, {
      content: [{ id: uuidv7(), type: 'action', text: 'Before delete' }],
    });

    expect(await findScenePlayBySceneId(sceneToDelete.id)).not.toBeNull();

    await permanentDeleteScene(sceneToDelete.id);
    expect(await findScenePlayBySceneId(sceneToDelete.id)).toBeNull();
  });
});
