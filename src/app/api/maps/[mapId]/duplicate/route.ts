import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { duplicateStoryMap } from '@/db/queries/maps';
import { duplicateMapSchema } from '@/lib/validators/maps';

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
    let newName: string | undefined;
    try {
      const json = await request.json();
      const parsed = duplicateMapSchema.safeParse(json);
      if (parsed.success) newName = parsed.data.name;
    } catch {
      // Body optional
    }

    const duplicated = await duplicateStoryMap(mapId, newName);
    return NextResponse.json({ data: duplicated }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
