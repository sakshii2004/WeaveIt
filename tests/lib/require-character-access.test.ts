import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireCharacterAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import * as projectQueries from '@/db/queries/projects';
import * as characterQueries from '@/db/queries/characters';
import type { Project, Character } from '@/db/schema';

describe('requireCharacterAccess helper', () => {
  const mockOwnerId = 'user-owner-123';
  const mockOtherUserId = 'user-intruder-456';
  const mockProjectId = 'project-789';
  const mockCharacterId = 'character-101';

  const mockProject: Project = {
    id: mockProjectId,
    ownerId: mockOwnerId,
    title: 'The Jaipur Connection',
    logline: 'A mystery novel',
    genre: 'Mystery',
    coverImageUrl: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCharacter: Character = {
    id: mockCharacterId,
    projectId: mockProjectId,
    name: 'Inspector Vijay',
    imageUrl: null,
    role: 'protagonist',
    roleCustom: null,
    description: 'Veteran detective',
    personality: 'Methodical',
    goals: 'Solve the station case',
    fears: 'Failing his family',
    background: 'Rajasthan Police',
    arc: 'Finds redemption',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeletedCharacter: Character = {
    ...mockCharacter,
    deletedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows owner to access character in their project', async () => {
    vi.spyOn(characterQueries, 'findCharacterById').mockResolvedValue(mockCharacter);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    const { character, project } = await requireCharacterAccess(mockCharacterId, mockOwnerId);
    expect(character.id).toBe(mockCharacterId);
    expect(project.id).toBe(mockProjectId);
  });

  it('throws ForbiddenError if user is not the project owner', async () => {
    vi.spyOn(characterQueries, 'findCharacterById').mockResolvedValue(mockCharacter);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    await expect(
      requireCharacterAccess(mockCharacterId, mockOtherUserId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError if character does not exist', async () => {
    vi.spyOn(characterQueries, 'findCharacterById').mockResolvedValue(null);

    await expect(
      requireCharacterAccess('non-existent-char', mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError if character is soft deleted and allowDeleted is false', async () => {
    vi.spyOn(characterQueries, 'findCharacterById').mockResolvedValue(mockDeletedCharacter);

    await expect(
      requireCharacterAccess(mockCharacterId, mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('allows access to soft deleted character when allowDeleted is true', async () => {
    vi.spyOn(characterQueries, 'findCharacterById').mockResolvedValue(mockDeletedCharacter);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    const { character } = await requireCharacterAccess(mockCharacterId, mockOwnerId, {
      allowDeleted: true,
    });
    expect(character.id).toBe(mockCharacterId);
    expect(character.deletedAt).not.toBeNull();
  });
});
