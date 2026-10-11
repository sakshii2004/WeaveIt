import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import * as projectQueries from '@/db/queries/projects';
import type { Project } from '@/db/schema';

describe('requireProjectAccess helper per PRD §6', () => {
  const mockOwnerId = 'user-owner-123';
  const mockOtherUserId = 'user-intruder-456';
  const mockProjectId = 'project-789';

  const mockActiveProject: Project = {
    id: mockProjectId,
    ownerId: mockOwnerId,
    title: 'The Jaipur Connection',
    logline: 'A mysterious disappearance at the platform.',
    genre: 'Mystery',
    coverImageUrl: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeletedProject: Project = {
    ...mockActiveProject,
    deletedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows owner to access their active project', async () => {
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockActiveProject);

    const project = await requireProjectAccess(mockProjectId, mockOwnerId);
    expect(project).toEqual(mockActiveProject);
    expect(project.id).toBe(mockProjectId);
  });

  it('throws ForbiddenError if user is not the owner', async () => {
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockActiveProject);

    await expect(
      requireProjectAccess(mockProjectId, mockOtherUserId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError if project does not exist', async () => {
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(null);

    await expect(
      requireProjectAccess('non-existent-id', mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError by default when project is soft-deleted', async () => {
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockDeletedProject);

    await expect(
      requireProjectAccess(mockProjectId, mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('allows access to soft-deleted project when allowDeleted option is true', async () => {
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockDeletedProject);

    const project = await requireProjectAccess(mockProjectId, mockOwnerId, {
      allowDeleted: true,
    });
    expect(project).toEqual(mockDeletedProject);
    expect(project.deletedAt).not.toBeNull();
  });

  it('throws ForbiddenError if arguments are missing', async () => {
    await expect(requireProjectAccess('', mockOwnerId)).rejects.toThrow(ForbiddenError);
    await expect(requireProjectAccess(mockProjectId, '')).rejects.toThrow(ForbiddenError);
  });
});
