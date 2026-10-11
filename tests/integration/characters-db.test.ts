import { describe, it, expect, beforeAll } from 'vitest';
import { createUser } from '@/db/queries/auth';
import { createProjectWithDefaults } from '@/db/queries/projects';
import {
  createCharacter,
  findCharacterById,
  listCharactersByProject,
  listDeletedCharactersByProject,
  updateCharacter,
  softDeleteCharacter,
  restoreCharacter,
  permanentDeleteCharacter,
  replaceCustomFields,
  listCustomFieldsByCharacter,
  listDistinctFieldKeysByProject,
  createRelationship,
  listRelationshipsByProject,
  listRelationshipsByCharacter,
  updateRelationship,
  deleteRelationship,
} from '@/db/queries/characters';
import { db } from '@/db';

describe('Characters Database Operations (Neon Postgres / Query Layer)', () => {
  const testEmail = `char_tester_${Date.now()}@weaveit.test`;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
    const user = await createUser({
      name: 'Author Rohan',
      email: testEmail,
      passwordHash: 'hashed_password',
    });
    testUserId = user.id;

    const project = await createProjectWithDefaults({
      ownerId: testUserId,
      title: 'Chronicles of the Iron Coast',
      genre: 'Epic Fantasy',
    });
    testProjectId = project.id;
  });

  it('creates character with profile fields per PRD §7.2', async () => {
    const char = await createCharacter({
      projectId: testProjectId,
      name: 'Kaela Stone',
      role: 'protagonist',
      description: 'A former sentinel of the Iron Gate.',
      personality: 'Resolute, taciturn, observant.',
      goals: 'Discover who sabotaged the northern beacon.',
      fears: 'That the winter rot was caused by her family.',
      background: 'Trained at the Iron Citadel for twelve years.',
      arc: 'Learns to trust allies before the final stand.',
    });

    expect(char.id).toBeDefined();
    expect(char.name).toBe('Kaela Stone');
    expect(char.role).toBe('protagonist');
    expect(char.goals).toBe('Discover who sabotaged the northern beacon.');
    expect(char.deletedAt).toBeNull();

    const fetched = await findCharacterById(char.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Kaela Stone');
  });

  it('updates character profile fields', async () => {
    const char = await createCharacter({
      projectId: testProjectId,
      name: 'Darius',
      role: 'supporting',
    });

    const updated = await updateCharacter(char.id, {
      role: 'mentor',
      goals: 'Pass down the beacon cipher',
    });

    expect(updated.role).toBe('mentor');
    expect(updated.goals).toBe('Pass down the beacon cipher');
  });

  it('manages custom fields with atomic replace and distinct key listing per PRD §7.2', async () => {
    const char = await createCharacter({
      projectId: testProjectId,
      name: 'Valeria',
      role: 'antagonist',
    });

    // 1. Initial replace
    const initialFields = await replaceCustomFields(char.id, [
      { key: 'Clan', value: 'Ironfang', orderIndex: 0 },
      { key: 'Weapon', value: 'Black Glass Spear', orderIndex: 1 },
      { key: 'Rank', value: 'Warmaster', orderIndex: 2 },
    ]);

    expect(initialFields).toHaveLength(3);
    expect(initialFields[0].key).toBe('Clan');
    expect(initialFields[1].value).toBe('Black Glass Spear');

    // 2. Query fields
    const retrieved = await listCustomFieldsByCharacter(char.id);
    expect(retrieved).toHaveLength(3);
    expect(retrieved.map((f) => f.key)).toEqual(['Clan', 'Weapon', 'Rank']);

    // 3. Atomic replace with reorder & edit
    const updatedFields = await replaceCustomFields(char.id, [
      { key: 'Weapon', value: 'Dual Glass Daggers', orderIndex: 0 },
      { key: 'Clan', value: 'Shadowfang', orderIndex: 1 },
    ]);

    expect(updatedFields).toHaveLength(2);
    expect(updatedFields[0].key).toBe('Weapon');

    // 4. Distinct keys in project
    const distinctKeys = await listDistinctFieldKeysByProject(testProjectId);
    expect(distinctKeys).toContain('Weapon');
    expect(distinctKeys).toContain('Clan');
  });

  it('manages character relationships (directed and undirected) per PRD §7.2', async () => {
    const charA = await createCharacter({
      projectId: testProjectId,
      name: 'Theron',
      role: 'supporting',
    });

    const charB = await createCharacter({
      projectId: testProjectId,
      name: 'Lyra',
      role: 'love_interest',
    });

    // Create directed relationship
    const rel = await createRelationship({
      projectId: testProjectId,
      sourceCharacterId: charA.id,
      targetCharacterId: charB.id,
      type: 'Secret Loyalty',
      description: 'Pledged to protect her during the crossing.',
      isDirected: true,
    });

    expect(rel.id).toBeDefined();
    expect(rel.type).toBe('Secret Loyalty');
    expect(rel.isDirected).toBe(true);

    // List by character (should appear for both source and target)
    const relsForA = await listRelationshipsByCharacter(charA.id);
    expect(relsForA.some((r) => r.id === rel.id)).toBe(true);

    const relsForB = await listRelationshipsByCharacter(charB.id);
    expect(relsForB.some((r) => r.id === rel.id)).toBe(true);

    const projectRels = await listRelationshipsByProject(testProjectId);
    expect(projectRels.some((r) => r.id === rel.id)).toBe(true);

    // Update relationship
    const updatedRel = await updateRelationship(rel.id, {
      description: 'Bond tested after the ambush.',
    });
    expect(updatedRel.description).toBe('Bond tested after the ambush.');

    // Delete relationship
    await deleteRelationship(rel.id);
    const afterDelete = await listRelationshipsByCharacter(charA.id);
    expect(afterDelete.some((r) => r.id === rel.id)).toBe(false);
  });

  it('handles soft-delete and restore lifecycle', async () => {
    const char = await createCharacter({
      projectId: testProjectId,
      name: 'Temporary Rebel',
      role: 'supporting',
    });

    // 1. Active list contains it
    let activeList = await listCharactersByProject(testProjectId);
    expect(activeList.some((c) => c.id === char.id)).toBe(true);

    // 2. Soft delete
    await softDeleteCharacter(char.id);

    activeList = await listCharactersByProject(testProjectId);
    expect(activeList.some((c) => c.id === char.id)).toBe(false);

    let deletedList = await listDeletedCharactersByProject(testProjectId);
    expect(deletedList.some((c) => c.id === char.id)).toBe(true);

    // 3. Restore
    await restoreCharacter(char.id);

    activeList = await listCharactersByProject(testProjectId);
    expect(activeList.some((c) => c.id === char.id)).toBe(true);

    deletedList = await listDeletedCharactersByProject(testProjectId);
    expect(deletedList.some((c) => c.id === char.id)).toBe(false);

    // 4. Permanent delete
    await permanentDeleteCharacter(char.id);
    const finalCheck = await findCharacterById(char.id);
    expect(finalCheck).toBeNull();
  });
});
