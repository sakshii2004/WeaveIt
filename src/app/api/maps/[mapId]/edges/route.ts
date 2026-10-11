import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireMapAccess, NotFoundError, ForbiddenError } from '@/lib/auth-helpers';
import { getMapWithDetails, createMapEdge, batchUpdateNodeSequenceIndices } from '@/db/queries/maps';
import { createMapEdgeSchema } from '@/lib/validators/maps';
import { deriveSequence } from '@/lib/sequence';

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
    const parsed = createMapEdgeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const details = await getMapWithDetails(mapId);
    if (!details) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Map not found' } }, { status: 404 });
    }

    // Sequence constraint validation
    if (parsed.data.edgeType === 'sequence') {
      const candidateEdges = [
        ...details.edges,
        {
          sourceNodeId: parsed.data.sourceNodeId,
          targetNodeId: parsed.data.targetNodeId,
          edgeType: 'sequence',
        },
      ];
      const nodeIds = details.nodes.map((n) => n.id);
      const derivation = deriveSequence(nodeIds, candidateEdges);
      if (!derivation.isValid) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: derivation.error || 'Invalid sequence edge' } },
          { status: 400 }
        );
      }

      const edge = await createMapEdge({ mapId, ...parsed.data });
      await batchUpdateNodeSequenceIndices(mapId, derivation.sequenceIndices);
      return NextResponse.json({ data: edge }, { status: 201 });
    }

    // Annotation edges
    const edge = await createMapEdge({ mapId, ...parsed.data });
    return NextResponse.json({ data: edge }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
