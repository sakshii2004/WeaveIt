import { eq, and, isNull, isNotNull, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../index';
import {
  characters,
  characterCustomFields,
  characterRelationships,
  type Character,
  type NewCharacter,
  type CharacterCustomField,
  type NewCharacterCustomField,
  type CharacterRelationship,
  type NewCharacterRelationship,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';

// In-memory fallback stores for test/offline stub mode
export const stubCharacters = new Map<string, Character>();
export const stubCustomFields = new Map<string, CharacterCustomField>();
export const stubRelationships = new Map<string, CharacterRelationship>();

export async function findCharacterById(id: string): Promise<Character | null> {
  if (db) {
    const result = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubCharacters.get(id) ?? null;
}

export async function listCharactersByProject(projectId: string): Promise<Character[]> {
  if (db) {
    return await db
      .select()
      .from(characters)
      .where(and(eq(characters.projectId, projectId), isNull(characters.deletedAt)))
      .orderBy(asc(characters.createdAt));
  }
  return Array.from(stubCharacters.values())
    .filter((c) => c.projectId === projectId && !c.deletedAt)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function listDeletedCharactersByProject(projectId: string): Promise<Character[]> {
  if (db) {
    return await db
      .select()
      .from(characters)
      .where(and(eq(characters.projectId, projectId), isNotNull(characters.deletedAt)))
      .orderBy(desc(characters.deletedAt));
  }
  return Array.from(stubCharacters.values())
    .filter((c) => c.projectId === projectId && Boolean(c.deletedAt))
    .sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));
}

export async function createCharacter(data: {
  projectId: string;
  name: string;
  imageUrl?: string | null;
  role?: string;
  roleCustom?: string | null;
  description?: string | null;
  personality?: string | null;
  goals?: string | null;
  fears?: string | null;
  background?: string | null;
  arc?: string | null;
}): Promise<Character> {
  const characterId = uuidv7();
  const now = new Date();

  const record: Character = {
    id: characterId,
    projectId: data.projectId,
    name: data.name,
    imageUrl: data.imageUrl ?? null,
    role: data.role ?? 'supporting',
    roleCustom: data.roleCustom ?? null,
    description: data.description ?? null,
    personality: data.personality ?? null,
    goals: data.goals ?? null,
    fears: data.fears ?? null,
    background: data.background ?? null,
    arc: data.arc ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(characters).values(record).returning();
    return inserted;
  }

  stubCharacters.set(characterId, record);
  return record;
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<NewCharacter, 'id' | 'projectId' | 'createdAt'>>
): Promise<Character> {
  const now = new Date();
  if (db) {
    const [updated] = await db
      .update(characters)
      .set({ ...data, updatedAt: now })
      .where(eq(characters.id, id))
      .returning();
    return updated;
  }

  const existing = stubCharacters.get(id);
  if (!existing) throw new Error(`Character ${id} not found`);
  const updated = { ...existing, ...data, updatedAt: now };
  stubCharacters.set(id, updated);
  return updated;
}

export async function softDeleteCharacter(id: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db.update(characters).set({ deletedAt: now, updatedAt: now }).where(eq(characters.id, id));
    return;
  }
  const existing = stubCharacters.get(id);
  if (existing) {
    stubCharacters.set(id, { ...existing, deletedAt: now, updatedAt: now });
  }
}

export async function restoreCharacter(id: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db.update(characters).set({ deletedAt: null, updatedAt: now }).where(eq(characters.id, id));
    return;
  }
  const existing = stubCharacters.get(id);
  if (existing) {
    stubCharacters.set(id, { ...existing, deletedAt: null, updatedAt: now });
  }
}

export async function permanentDeleteCharacter(id: string): Promise<void> {
  if (db) {
    await db.delete(characters).where(eq(characters.id, id));
    return;
  }
  stubCharacters.delete(id);
  for (const [cfId, cf] of stubCustomFields.entries()) {
    if (cf.characterId === id) stubCustomFields.delete(cfId);
  }
  for (const [relId, rel] of stubRelationships.entries()) {
    if (rel.sourceCharacterId === id || rel.targetCharacterId === id) {
      stubRelationships.delete(relId);
    }
  }
}

// -------------------------------------------------------------
// Custom Fields Queries
// -------------------------------------------------------------

export async function listCustomFieldsByCharacter(characterId: string): Promise<CharacterCustomField[]> {
  if (db) {
    return await db
      .select()
      .from(characterCustomFields)
      .where(eq(characterCustomFields.characterId, characterId))
      .orderBy(asc(characterCustomFields.orderIndex));
  }
  return Array.from(stubCustomFields.values())
    .filter((f) => f.characterId === characterId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function replaceCustomFields(
  characterId: string,
  fields: Array<{ key: string; value: string; orderIndex: number }>
): Promise<CharacterCustomField[]> {
  const now = new Date();

  if (db) {
    await db.delete(characterCustomFields).where(eq(characterCustomFields.characterId, characterId));
    if (fields.length === 0) return [];

    const rows: NewCharacterCustomField[] = fields.map((f, idx) => ({
      id: uuidv7(),
      characterId,
      key: f.key.trim(),
      value: f.value,
      orderIndex: f.orderIndex ?? idx,
      createdAt: now,
      updatedAt: now,
    }));

    return await db.insert(characterCustomFields).values(rows).returning();
  }

  // Fallback in-memory
  for (const [cfId, cf] of stubCustomFields.entries()) {
    if (cf.characterId === characterId) stubCustomFields.delete(cfId);
  }
  const inserted: CharacterCustomField[] = [];
  fields.forEach((f, idx) => {
    const id = uuidv7();
    const item: CharacterCustomField = {
      id,
      characterId,
      key: f.key.trim(),
      value: f.value,
      orderIndex: f.orderIndex ?? idx,
      createdAt: now,
      updatedAt: now,
    };
    stubCustomFields.set(id, item);
    inserted.push(item);
  });
  return inserted;
}

export async function listDistinctFieldKeysByProject(projectId: string): Promise<string[]> {
  if (db) {
    const projectCharacters = await db
      .select({ id: characters.id })
      .from(characters)
      .where(and(eq(characters.projectId, projectId), isNull(characters.deletedAt)));

    if (projectCharacters.length === 0) return [];
    const charIds = projectCharacters.map((c) => c.id);

    const rows = await db
      .selectDistinct({ key: characterCustomFields.key })
      .from(characterCustomFields)
      .where(inArray(characterCustomFields.characterId, charIds))
      .orderBy(asc(characterCustomFields.key));

    return rows.map((r) => r.key);
  }

  const charIds = new Set(
    Array.from(stubCharacters.values())
      .filter((c) => c.projectId === projectId && !c.deletedAt)
      .map((c) => c.id)
  );

  const keys = new Set<string>();
  for (const field of stubCustomFields.values()) {
    if (charIds.has(field.characterId)) {
      keys.add(field.key);
    }
  }
  return Array.from(keys).sort();
}

// -------------------------------------------------------------
// Relationships Queries
// -------------------------------------------------------------

export interface EnrichedRelationship extends CharacterRelationship {
  sourceCharacter: { id: string; name: string; role: string; imageUrl: string | null };
  targetCharacter: { id: string; name: string; role: string; imageUrl: string | null };
}

export async function findRelationshipById(id: string): Promise<CharacterRelationship | null> {
  if (db) {
    const result = await db.select().from(characterRelationships).where(eq(characterRelationships.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubRelationships.get(id) ?? null;
}

export async function listRelationshipsByProject(projectId: string): Promise<EnrichedRelationship[]> {
  if (db) {
    const rels = await db
      .select()
      .from(characterRelationships)
      .where(eq(characterRelationships.projectId, projectId))
      .orderBy(desc(characterRelationships.createdAt));

    const allChars = await db
      .select()
      .from(characters)
      .where(eq(characters.projectId, projectId));
    const charMap = new Map(allChars.map((c) => [c.id, c]));

    return rels.map((r) => {
      const source = charMap.get(r.sourceCharacterId);
      const target = charMap.get(r.targetCharacterId);
      return {
        ...r,
        sourceCharacter: {
          id: r.sourceCharacterId,
          name: source?.name ?? 'Unknown',
          role: source?.role ?? 'supporting',
          imageUrl: source?.imageUrl ?? null,
        },
        targetCharacter: {
          id: r.targetCharacterId,
          name: target?.name ?? 'Unknown',
          role: target?.role ?? 'supporting',
          imageUrl: target?.imageUrl ?? null,
        },
      };
    });
  }

  return Array.from(stubRelationships.values())
    .filter((r) => r.projectId === projectId)
    .map((r) => {
      const source = stubCharacters.get(r.sourceCharacterId);
      const target = stubCharacters.get(r.targetCharacterId);
      return {
        ...r,
        sourceCharacter: {
          id: r.sourceCharacterId,
          name: source?.name ?? 'Unknown',
          role: source?.role ?? 'supporting',
          imageUrl: source?.imageUrl ?? null,
        },
        targetCharacter: {
          id: r.targetCharacterId,
          name: target?.name ?? 'Unknown',
          role: target?.role ?? 'supporting',
          imageUrl: target?.imageUrl ?? null,
        },
      };
    });
}

export async function listRelationshipsByCharacter(characterId: string): Promise<EnrichedRelationship[]> {
  const char = await findCharacterById(characterId);
  if (!char) return [];
  const allProjectRels = await listRelationshipsByProject(char.projectId);
  return allProjectRels.filter(
    (r) => r.sourceCharacterId === characterId || r.targetCharacterId === characterId
  );
}

export async function createRelationship(data: {
  projectId: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  type: string;
  description?: string | null;
  isDirected?: boolean;
  startSceneId?: string | null;
  endSceneId?: string | null;
}): Promise<CharacterRelationship> {
  const id = uuidv7();
  const now = new Date();

  const record: CharacterRelationship = {
    id,
    projectId: data.projectId,
    sourceCharacterId: data.sourceCharacterId,
    targetCharacterId: data.targetCharacterId,
    type: data.type.trim(),
    description: data.description ?? null,
    isDirected: data.isDirected ?? true,
    startSceneId: data.startSceneId ?? null,
    endSceneId: data.endSceneId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    const [inserted] = await db.insert(characterRelationships).values(record).returning();
    return inserted;
  }

  stubRelationships.set(id, record);
  return record;
}

export async function updateRelationship(
  id: string,
  data: Partial<Omit<NewCharacterRelationship, 'id' | 'projectId' | 'createdAt'>>
): Promise<CharacterRelationship> {
  const now = new Date();
  if (db) {
    const [updated] = await db
      .update(characterRelationships)
      .set({ ...data, updatedAt: now })
      .where(eq(characterRelationships.id, id))
      .returning();
    return updated;
  }

  const existing = stubRelationships.get(id);
  if (!existing) throw new Error(`Relationship ${id} not found`);
  const updated = { ...existing, ...data, updatedAt: now };
  stubRelationships.set(id, updated);
  return updated;
}

export async function deleteRelationship(id: string): Promise<void> {
  if (db) {
    await db.delete(characterRelationships).where(eq(characterRelationships.id, id));
    return;
  }
  stubRelationships.delete(id);
}
