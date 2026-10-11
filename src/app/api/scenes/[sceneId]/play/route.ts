import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { findScenePlayBySceneId, upsertScenePlay } from '@/db/queries/play';
import { saveScenePlaySchema } from '@/lib/validators/play';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { sceneId } = await params;
  try {
    await requireSceneAccess(sceneId, session.user.id);
    const play = await findScenePlayBySceneId(sceneId);
    return NextResponse.json({ data: play });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { sceneId } = await params;
  try {
    await requireSceneAccess(sceneId, session.user.id);
    const json = await request.json();
    const parsed = saveScenePlaySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const play = await upsertScenePlay(sceneId, parsed.data);
    return NextResponse.json({ data: play });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
