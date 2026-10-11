import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import * as projectQueries from '@/db/queries/projects';
import * as sceneQueries from '@/db/queries/scenes';
import type { Project, Scene } from '@/db/schema';

describe('requireSceneAccess helper', () => {
  const mockOwnerId = 'user-owner-123';
  const mockOtherUserId = 'user-intruder-456';
  const mockProjectId = 'project-789';
  const mockSceneId = 'scene-101';

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

  const mockScene: Scene = {
    id: mockSceneId,
    projectId: mockProjectId,
    title: 'She runs into him at the Jaipur railway station',
    status: 'seed',
    description: 'Steam hisses across Platform 3.',
    sceneType: 'inciting',
    purpose: 'Sets the mystery in motion.',
    locationId: null,
    chapterId: null,
    actId: null,
    timeLabel: 'Day 1, 9:00 PM',
    color: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeletedScene: Scene = {
    ...mockScene,
    deletedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows owner to access scene in their project', async () => {
    vi.spyOn(sceneQueries, 'findSceneById').mockResolvedValue(mockScene);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    const { scene, project } = await requireSceneAccess(mockSceneId, mockOwnerId);
    expect(scene.id).toBe(mockSceneId);
    expect(project.id).toBe(mockProjectId);
  });

  it('throws ForbiddenError if user is not the project owner', async () => {
    vi.spyOn(sceneQueries, 'findSceneById').mockResolvedValue(mockScene);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    await expect(
      requireSceneAccess(mockSceneId, mockOtherUserId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError if scene does not exist', async () => {
    vi.spyOn(sceneQueries, 'findSceneById').mockResolvedValue(null);

    await expect(
      requireSceneAccess('non-existent-scene', mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError for soft-deleted scene by default', async () => {
    vi.spyOn(sceneQueries, 'findSceneById').mockResolvedValue(mockDeletedScene);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    await expect(
      requireSceneAccess(mockSceneId, mockOwnerId)
    ).rejects.toThrow(NotFoundError);
  });

  it('allows accessing soft-deleted scene when allowDeleted option is true', async () => {
    vi.spyOn(sceneQueries, 'findSceneById').mockResolvedValue(mockDeletedScene);
    vi.spyOn(projectQueries, 'findProjectById').mockResolvedValue(mockProject);

    const { scene } = await requireSceneAccess(mockSceneId, mockOwnerId, { allowDeleted: true });
    expect(scene.id).toBe(mockSceneId);
    expect(scene.deletedAt).toBeTruthy();
  });
});
