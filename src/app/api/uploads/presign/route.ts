import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireProjectAccess } from '@/lib/auth-helpers';
import { generatePresignedUploadUrl, validateImageUpload, isStorageConfigured, type AllowedImageType } from '@/lib/storage';
import { z } from 'zod';

const presignRequestSchema = z.object({
  projectId: z.string().uuid(),
  entityId: z.string().uuid(),
  folder: z.enum(['characters', 'covers', 'vibe']).default('characters'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'You must be signed in' } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = presignRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { projectId, entityId, folder, contentType, fileSize } = parsed.data;

    // Check project ownership
    await requireProjectAccess(projectId, session.user.id);

    if (!isStorageConfigured()) {
      return NextResponse.json(
        {
          error: {
            code: 'STORAGE_NOT_CONFIGURED',
            message: 'Image upload storage is not configured on the server. Please configure Cloudflare R2 environment variables.',
          },
        },
        { status: 503 }
      );
    }

    validateImageUpload(contentType, fileSize);

    const result = await generatePresignedUploadUrl({
      folder,
      projectId,
      entityId,
      contentType: contentType as AllowedImageType,
      fileSize,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'NotFoundError') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 });
    }
    if (err.name === 'ForbiddenError') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: err.message } }, { status: 403 });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to generate upload URL' } },
      { status: 500 }
    );
  }
}
