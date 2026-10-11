import * as React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  listStoryMapsByProject,
  getMapWithDetails,
  createStoryMap,
  addSceneToMap,
  type StoryMapDetails,
} from '@/db/queries/maps';
import { listScenesByProject, type SceneWithDetails } from '@/db/queries/scenes';
import {
  listActsByProject,
  listChaptersByProject,
  listLocationsByProject,
  listThreadsByProject,
} from '@/db/queries/structure';
import { listCharactersByProject } from '@/db/queries/characters';
import { StoryMapWorkspace } from '@/components/canvas/StoryMapWorkspace';
import type { StoryMap, Act, Chapter, Location, Character, Thread } from '@/db/schema';

interface StoryMapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mapId?: string }>;
}

export async function generateMetadata({ params }: StoryMapPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: 'Story Map | WeaveIt' };
  }

  try {
    const project = await requireProjectAccess(id, session.user.id);
    return {
      title: `Story Map — ${project.title} | WeaveIt`,
      description: `Visual story planning and scene connections for ${project.title}`,
    };
  } catch {
    return { title: 'Story Map | WeaveIt' };
  }
}

export default async function StoryMapPage({ params, searchParams }: StoryMapPageProps) {
  const { id: projectId } = await params;
  const { mapId: queryMapId } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  let mapDetails: StoryMapDetails | null = null;
  let maps: StoryMap[] = [];
  let allScenes: SceneWithDetails[] = [];
  let acts: Act[] = [];
  let chapters: Chapter[] = [];
  let locations: Location[] = [];
  let characters: Character[] = [];
  let threads: Thread[] = [];

  try {
    await requireProjectAccess(projectId, session.user.id);

    // 1. Fetch all maps for this project
    maps = await listStoryMapsByProject(projectId);
    if (maps.length === 0) {
      const defaultMap = await createStoryMap({
        projectId,
        name: 'Main Story Map',
        kind: 'story',
        isDefault: true,
      });
      maps = [defaultMap];
    }

    // 2. Determine active map
    let activeMap = queryMapId ? maps.find((m) => m.id === queryMapId) : maps.find((m) => m.isDefault);
    if (!activeMap) activeMap = maps[0];

    // 3. Fetch project scenes & related data
    const [fetchedScenes, fetchedActs, fetchedChapters, fetchedLocations, fetchedCharacters, fetchedThreads] =
      await Promise.all([
        listScenesByProject(projectId),
        listActsByProject(projectId),
        listChaptersByProject(projectId, activeMap.id),
        listLocationsByProject(projectId),
        listCharactersByProject(projectId),
        listThreadsByProject(projectId),
      ]);

    allScenes = fetchedScenes;
    acts = fetchedActs;
    chapters = fetchedChapters;
    locations = fetchedLocations;
    characters = fetchedCharacters;
    threads = fetchedThreads;

    // 4. Fetch map graph details
    mapDetails = await getMapWithDetails(activeMap.id);

    // If active map is empty but project has scenes, auto-populate them as initial nodes
    if (mapDetails && mapDetails.nodes.length === 0 && allScenes.length > 0) {
      for (let i = 0; i < allScenes.length; i++) {
        const sc = allScenes[i];
        const row = Math.floor(i / 4);
        const col = i % 4;
        await addSceneToMap(activeMap.id, sc.id, {
          x: 100 + col * 320,
          y: 120 + row * 220,
        });
      }
      mapDetails = await getMapWithDetails(activeMap.id);
    }
  } catch (err: unknown) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  if (!mapDetails) {
    notFound();
  }

  return (
    <StoryMapWorkspace
      initialDetails={mapDetails}
      allMaps={maps}
      allScenes={allScenes}
      acts={acts}
      chapters={chapters}
      locations={locations}
      characters={characters}
      threads={threads}
    />
  );
}
