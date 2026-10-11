import { describe, it, expect } from 'vitest';
import { validateImageUpload, isStorageConfigured, MAX_FILE_SIZE } from '@/lib/storage';

describe('Storage Upload Validation', () => {
  it('accepts valid JPEG, PNG, and WebP within 10MB', () => {
    expect(() => validateImageUpload('image/jpeg', 1024 * 500)).not.toThrow();
    expect(() => validateImageUpload('image/png', 1024 * 1024 * 2)).not.toThrow();
    expect(() => validateImageUpload('image/webp', MAX_FILE_SIZE)).not.toThrow();
  });

  it('rejects unsupported image types', () => {
    expect(() => validateImageUpload('image/gif', 1024)).toThrow(/Invalid file type/);
    expect(() => validateImageUpload('image/svg+xml', 1024)).toThrow(/Invalid file type/);
    expect(() => validateImageUpload('application/pdf', 1024)).toThrow(/Invalid file type/);
  });

  it('rejects empty files (0 bytes)', () => {
    expect(() => validateImageUpload('image/png', 0)).toThrow(/File size must be between/);
  });

  it('rejects files exceeding 10 MB', () => {
    expect(() => validateImageUpload('image/jpeg', MAX_FILE_SIZE + 1)).toThrow(/File size must be between/);
  });

  it('reports configuration status boolean', () => {
    expect(typeof isStorageConfigured()).toBe('boolean');
  });
});
