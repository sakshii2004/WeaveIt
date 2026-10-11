import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { getSceneWithDetails, updateScene, softDeleteScene, permanentDeleteScene } from '@/db/queries/scenes';
import { updateSceneSchema } from '@/lib/validators/scenes';

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
    const scene = await getSceneWithDetails(sceneId);
    if (!scene) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Scene not found' } }, { status: 404 });
    }
    return NextResponse.json({ data: scene });
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

export async function PATCH(
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
    const parsed = updateSceneSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateScene(sceneId, parsed.data);
    return NextResponse.json({ data: updated });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { sceneId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    await requireSceneAccess(sceneId, session.user.id, { allowDeleted: permanent });
    if (permanent) {
      await permanentDeleteScene(sceneId);
    } else {
      await softDeleteScene(sceneId);
    }

    return NextResponse.json({ success: true, id: sceneId });
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
