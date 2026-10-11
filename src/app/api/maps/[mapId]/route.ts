import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { getMapWithDetails, updateStoryMap, deleteStoryMap } from '@/db/queries/maps';
import { updateMapSchema } from '@/lib/validators/maps';

export async function GET(
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
    const details = await getMapWithDetails(mapId);
    if (!details) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Map not found' } }, { status: 404 });
    }
    return NextResponse.json({ data: details });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(
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
    const parsed = updateMapSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateStoryMap(mapId, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { mapId } = await params;
  try {
    const { map } = await requireMapAccess(mapId, session.user.id);
    if (map.isDefault) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot delete default story map' } },
        { status: 400 }
      );
    }
    await deleteStoryMap(mapId);
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
