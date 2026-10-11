import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import * as projectQueries from '@/db/queries/projects';
import * as mapQueries from '@/db/queries/maps';
import type { Project, StoryMap } from '@/db/schema';

describe('requireMapAccess helper', () => {
  const mockOwnerId = 'user-owner-123';
  const mockOtherUserId = 'user-intruder-456';
  const mockProjectId = 'project-789';
  const mockMapId = 'map-101';

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

  const mockMap: StoryMap = {
    id: mockMapId,
    projectId: mockProjectId,
    name: 'Main Story Map',
    kind: 'story',
    isDefault: true,
    viewport: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows owner to access a story map in their project', async () => {
    vi.spyOn(mapQueries, 'findStoryMapById').mockResolvedValue(mockMap);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    const { map, project } = await requireMapAccess(mockMapId, mockOwnerId);
    expect(map.id).toBe(mockMapId);
    expect(project.id).toBe(mockProjectId);
  });

  it('throws ForbiddenError if non-owner tries to access map', async () => {
    vi.spyOn(mapQueries, 'findStoryMapById').mockResolvedValue(mockMap);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    await expect(requireMapAccess(mockMapId, mockOtherUserId)).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError if map does not exist', async () => {
    vi.spyOn(mapQueries, 'findStoryMapById').mockResolvedValue(null);

    await expect(requireMapAccess('non-existent', mockOwnerId)).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError if credentials or map ID are missing', async () => {
    await expect(requireMapAccess('', mockOwnerId)).rejects.toThrow(ForbiddenError);
    await expect(requireMapAccess(mockMapId, '')).rejects.toThrow(ForbiddenError);
  });
});
