import * as React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { getDefaultStoryMap } from '@/db/queries/projects';
import { listScenesByProject, type SceneWithDetails } from '@/db/queries/scenes';
import {
  listActsByProject,
  listChaptersByProject,
  listLocationsByProject,
  listThreadsByProject,
} from '@/db/queries/structure';
import { listCharactersByProject } from '@/db/queries/characters';
import { ProjectHomeView } from '@/components/projects/ProjectHomeView';
import type { Project, Act, Chapter, Location, Thread, Character, StoryMap } from '@/db/schema';

export const instant = false;

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: 'Project | WeaveIt' };
  }

  try {
    const project = await requireProjectAccess(id, session.user.id);
    return {
      title: `${project.title} | WeaveIt`,
      description: project.logline || `Story planning workspace for ${project.title}`,
    };
  } catch {
    return { title: 'Project | WeaveIt' };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  let project: Project;
  let scenes: SceneWithDetails[];
  let acts: Act[];
  let chapters: Chapter[];
  let locations: Location[];
  let threads: Thread[];
  let characters: Character[];
  let storyMap: StoryMap | null;

  try {
    project = await requireProjectAccess(id, session.user.id);

    const [
      scenesData,
      actsData,
      chaptersData,
      locationsData,
      threadsData,
      charactersData,
      storyMapData,
    ] = await Promise.all([
      listScenesByProject(id),
      listActsByProject(id),
      listChaptersByProject(id),
      listLocationsByProject(id),
      listThreadsByProject(id),
      listCharactersByProject(id),
      getDefaultStoryMap(id),
    ]);

    scenes = scenesData;
    acts = actsData;
    chapters = chaptersData;
    locations = locationsData;
    threads = threadsData;
    characters = charactersData;
    storyMap = storyMapData;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  return (
    <ProjectHomeView
      project={project}
      acts={acts}
      chapters={chapters}
      locations={locations}
      threads={threads}
      characters={characters}
      storyMap={storyMap}
      initialScenes={scenes}
    />
  );
}
