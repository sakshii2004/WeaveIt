import * as React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { listScenesByProject, type SceneWithDetails } from '@/db/queries/scenes';
import {
  listActsByProject,
  listChaptersByProject,
  listLocationsByProject,
  listThreadsByProject,
} from '@/db/queries/structure';
import { listCharactersByProject } from '@/db/queries/characters';
import { ChapterOverviewView } from '@/components/chapters/ChapterOverviewView';
import type { Project, Act, Chapter, Location, Thread, Character } from '@/db/schema';

export const instant = false;

interface ChaptersPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ChaptersPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: 'Chapters | WeaveIt' };
  }

  try {
    const project = await requireProjectAccess(id, session.user.id);
    return {
      title: `Chapters · ${project.title} | WeaveIt`,
      description: `Chapter outline and scene breakdown for ${project.title}`,
    };
  } catch {
    return { title: 'Chapters | WeaveIt' };
  }
}

export default async function ChaptersPage({ params }: ChaptersPageProps) {
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

  try {
    project = await requireProjectAccess(id, session.user.id);

    const [
      scenesData,
      actsData,
      chaptersData,
      locationsData,
      threadsData,
      charactersData,
    ] = await Promise.all([
      listScenesByProject(id),
      listActsByProject(id),
      listChaptersByProject(id),
      listLocationsByProject(id),
      listThreadsByProject(id),
      listCharactersByProject(id),
    ]);

    scenes = scenesData;
    acts = actsData;
    chapters = chaptersData;
    locations = locationsData;
    threads = threadsData;
    characters = charactersData;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  return (
    <ChapterOverviewView
      project={project}
      acts={acts}
      chapters={chapters}
      locations={locations}
      threads={threads}
      characters={characters}
      scenes={scenes}
    />
  );
}
