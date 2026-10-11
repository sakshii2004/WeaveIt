'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface CharacterImageUploadProps {
  projectId: string;
  characterId: string;
  characterName: string;
  currentImageUrl?: string | null;
  onUploaded: (url: string) => void;
}

export function CharacterImageUpload({
  projectId,
  characterId,
  characterName,
  currentImageUrl,
  onUploaded,
}: CharacterImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentImageUrl ?? null);
  const [prevImageUrl, setPrevImageUrl] = React.useState<string | null>(currentImageUrl ?? null);

  if (currentImageUrl !== prevImageUrl) {
    setPrevImageUrl(currentImageUrl ?? null);
    setPreviewUrl(currentImageUrl ?? null);
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size client-side
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a JPEG, PNG, or WebP image.',
        variant: 'error',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Character portrait must be under 10 MB.',
        variant: 'error',
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Request presigned upload URL
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          entityId: characterId,
          folder: 'characters',
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        if (presignData.error?.code === 'STORAGE_NOT_CONFIGURED') {
          toast({
            title: 'Storage not configured',
            description:
              'Cloudflare R2 storage credentials are not configured yet. Character image upload is disabled.',
            variant: 'error',
          });
        } else {
          toast({
            title: 'Upload failed',
            description: presignData.error?.message || 'Could not initiate upload.',
            variant: 'error',
          });
        }
        setIsUploading(false);
        return;
      }

      const { uploadUrl, publicUrl } = presignData;

      // 2. Direct PUT to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image to storage.');
      }

      setPreviewUrl(publicUrl);
      onUploaded(publicUrl);

      toast({
        title: 'Portrait uploaded',
        description: 'Character image saved successfully.',
        variant: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Upload failed',
        description: (err as Error).message || 'An error occurred while uploading portrait.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar
          src={previewUrl}
          name={characterName}
          className="h-20 w-20 rounded-2xl text-xl shadow-xs border-2 border-line/80 object-cover"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Upload character portrait"
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Change portrait
              </>
            )}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreviewUrl(null);
                onUploaded('');
              }}
              className="text-xs text-ink-soft hover:text-coral"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-ink-soft">
          JPEG, PNG, or WebP. Max 10 MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
