import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireMapAccess, requireSceneAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { addSceneToMap } from '@/db/queries/maps';
import { addSceneToMapSchema } from '@/lib/validators/maps';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { mapId } = await params;
  try {
    await requireMapAccess(mapId, session.user.id);
    const json = await request.json();
    const parsed = addSceneToMapSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    // Ensure the scene belongs to the project
    await requireSceneAccess(parsed.data.sceneId, session.user.id);

    const node = await addSceneToMap(mapId, parsed.data.sceneId, {
      x: parsed.data.x,
      y: parsed.data.y,
    });
    return NextResponse.json({ data: node }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
