import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireProjectAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { listThreadsByProject, createThread } from '@/db/queries/structure';
import { createThreadSchema } from '@/lib/validators/structure';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  try {
    await requireProjectAccess(id, session.user.id);
    const threads = await listThreadsByProject(id);
    return NextResponse.json({ data: threads });
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { id } = await params;
  try {
    await requireProjectAccess(id, session.user.id);
    const json = await request.json();
    const parsed = createThreadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const thread = await createThread({ projectId: id, ...parsed.data });
    return NextResponse.json({ data: thread }, { status: 201 });
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
