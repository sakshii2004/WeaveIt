import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { v7 as uuidv7 } from 'uuid';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per PRD §8.7

/**
 * Returns true if Cloudflare R2 credentials are fully configured
 */
export function isStorageConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME
  );
}

/**
 * Get configured S3 client for Cloudflare R2
 */
function getR2Client(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error('Cloudflare R2 storage is not configured.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Validate upload request parameters
 */
export function validateImageUpload(contentType: string, fileSize: number): void {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType as AllowedImageType)) {
    throw new Error(
      `Invalid file type "${contentType}". Allowed types: JPEG, PNG, WebP.`
    );
  }

  if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size must be between 1 byte and 10 MB. Received: ${fileSize} bytes.`);
  }
}

/**
 * Generate a presigned PUT URL for client-side direct upload to R2
 */
export async function generatePresignedUploadUrl(params: {
  folder: string;
  projectId: string;
  entityId: string;
  contentType: AllowedImageType;
  fileSize: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  validateImageUpload(params.contentType, params.fileSize);

  if (!isStorageConfigured()) {
    throw new Error(
      'Storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in environment.'
    );
  }

  const extMap: Record<AllowedImageType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const extension = extMap[params.contentType];
  const fileId = uuidv7();
  const key = `${params.folder}/${params.projectId}/${params.entityId}/${fileId}.${extension}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: params.contentType,
  });

  // Presigned URL valid for 5 minutes (300 seconds)
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  // Public URL via custom domain or R2 public URL
  const baseUrl = env.R2_PUBLIC_URL
    ? env.R2_PUBLIC_URL.replace(/\/$/, '')
    : `https://${env.R2_BUCKET_NAME}.r2.dev`;

  const publicUrl = `${baseUrl}/${key}`;

  return { uploadUrl, publicUrl, key };
}
