import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import {
  listCharactersByProject,
  listDistinctFieldKeysByProject,
  listCustomFieldsByCharacter,
  listRelationshipsByCharacter,
} from '@/db/queries/characters';
import { listRecentScenes } from '@/db/queries/projects';
import { CharacterGrid } from '@/components/characters/CharacterGrid';
import { ArrowLeft, Users } from 'lucide-react';
import type { Character, CharacterCustomField, Scene } from '@/db/schema';
import type { EnrichedRelationship } from '@/db/queries/characters';

export const instant = false;

interface CharactersPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CharactersPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return { title: 'Characters | WeaveIt' };
  }

  try {
    const project = await requireProjectAccess(id, session.user.id);
    return {
      title: `Characters — ${project.title} | WeaveIt`,
      description: `Cast and character relationships for ${project.title}`,
    };
  } catch {
    return { title: 'Characters | WeaveIt' };
  }
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  let project: { id: string; title: string; genre: string | null };
  let charactersList: Character[];
  let scenesList: Scene[];
  let fieldKeys: string[];
  const allFieldsMap: Record<string, CharacterCustomField[]> = {};
  const allRelationshipsMap: Record<string, EnrichedRelationship[]> = {};

  try {
    project = await requireProjectAccess(id, session.user.id);

    const [charsData, scenesData, keysData] = await Promise.all([
      listCharactersByProject(id),
      listRecentScenes(id, 100),
      listDistinctFieldKeysByProject(id),
    ]);

    charactersList = charsData;
    scenesList = scenesData;
    fieldKeys = keysData;

    await Promise.all(
      charactersList.map(async (char) => {
        const [fields, rels] = await Promise.all([
          listCustomFieldsByCharacter(char.id),
          listRelationshipsByCharacter(char.id),
        ]);
        allFieldsMap[char.id] = fields;
        allRelationshipsMap[char.id] = rels;
      })
    );
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Breadcrumb & Header */}
      <div className="space-y-2">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {project.title}</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-story-teal-bg text-story-teal-text border border-story-teal-border flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-ink">Characters</h1>
                <span className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-soft border border-line">
                  {charactersList.length}
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                The cast driving the conflicts and transformations in {project.title}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Character Grid */}
      <CharacterGrid
        projectId={project.id}
        genre={project.genre}
        initialCharacters={charactersList}
        scenes={scenesList}
        allFieldsMap={allFieldsMap}
        allRelationshipsMap={allRelationshipsMap}
        projectFieldKeys={fieldKeys}
      />
    </div>
  );
}
