import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { listStoryMapsByProject, createStoryMap } from '@/db/queries/maps';
import { createMapSchema } from '@/lib/validators/maps';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id: projectId } = await params;
  try {
    await requireProjectAccess(projectId, session.user.id);
    const maps = await listStoryMapsByProject(projectId);
    return NextResponse.json({ data: maps });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id: projectId } = await params;
  try {
    await requireProjectAccess(projectId, session.user.id);
    const json = await request.json();
    const parsed = createMapSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const map = await createStoryMap({
      projectId,
      ...parsed.data,
    });
    return NextResponse.json({ data: map }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
