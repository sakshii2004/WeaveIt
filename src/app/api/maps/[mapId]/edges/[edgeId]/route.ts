import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { getMapWithDetails, updateMapEdge, deleteMapEdge, batchUpdateNodeSequenceIndices } from '@/db/queries/maps';
import { updateMapEdgeSchema } from '@/lib/validators/maps';
import { deriveSequence } from '@/lib/sequence';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string; edgeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { mapId, edgeId } = await params;
  try {
    await requireMapAccess(mapId, session.user.id);
    const json = await request.json();
    const parsed = updateMapEdgeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateMapEdge(edgeId, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string; edgeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  const { mapId, edgeId } = await params;
  try {
    await requireMapAccess(mapId, session.user.id);
    await deleteMapEdge(edgeId);

    // Recompute sequence after edge removal
    const details = await getMapWithDetails(mapId);
    if (details) {
      const nodeIds = details.nodes.map((n) => n.id);
      const derivation = deriveSequence(nodeIds, details.edges);
      if (derivation.isValid) {
        await batchUpdateNodeSequenceIndices(mapId, derivation.sequenceIndices);
      }
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
