import { describe, it, expect } from 'vitest';
import {
  createActSchema,
  updateActSchema,
  reorderActsSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
  createLocationSchema,
  updateLocationSchema,
  createThreadSchema,
  updateThreadSchema,
} from '@/lib/validators/structure';
import { v7 as uuidv7 } from 'uuid';

describe('Structure Validators', () => {
  describe('Acts', () => {
    it('accepts valid act creation', () => {
      const parsed = createActSchema.safeParse({
        name: 'Act I: The Call',
        color: 'teal',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty act name', () => {
      const parsed = createActSchema.safeParse({
        name: '   ',
        color: 'teal',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates act update schema', () => {
      const parsed = updateActSchema.safeParse({
        name: 'Act I: The Crossing',
        color: 'sun',
      });
      expect(parsed.success).toBe(true);
    });

    it('validates reorderActsSchema', () => {
      const id1 = uuidv7();
      const id2 = uuidv7();
      const parsed = reorderActsSchema.safeParse({ actIds: [id1, id2] });
      expect(parsed.success).toBe(true);
    });
  });

  describe('Chapters', () => {
    it('accepts valid chapter creation', () => {
      const parsed = createChapterSchema.safeParse({
        title: 'Chapter 01: The Mystery at the Gate',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty chapter title', () => {
      const parsed = createChapterSchema.safeParse({
        title: '',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates chapter update schema', () => {
      const parsed = updateChapterSchema.safeParse({
        title: 'Chapter 01: The Gate',
      });
      expect(parsed.success).toBe(true);
    });

    it('validates reorderChaptersSchema', () => {
      const id1 = uuidv7();
      const id2 = uuidv7();
      const parsed = reorderChaptersSchema.safeParse({ chapterIds: [id1, id2] });
      expect(parsed.success).toBe(true);
    });
  });

  describe('Locations', () => {
    it('accepts valid location creation', () => {
      const parsed = createLocationSchema.safeParse({
        name: 'Jaipur Railway Station',
        description: 'Bustling colonial-era transit hub with red sandstone arches.',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty location name', () => {
      const parsed = createLocationSchema.safeParse({
        name: '  ',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates location update schema', () => {
      const parsed = updateLocationSchema.safeParse({
        name: 'Jaipur Station - Platform 3',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('Threads', () => {
    it('accepts valid thread creation', () => {
      const parsed = createThreadSchema.safeParse({
        name: 'The Forged Letter',
        color: 'coral',
        description: 'Tracking the provenance of the letter found in the carriage.',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty thread name', () => {
      const parsed = createThreadSchema.safeParse({
        name: '',
        color: 'coral',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates thread update schema', () => {
      const parsed = updateThreadSchema.safeParse({
        name: 'The Forged Envelope',
        color: 'mint',
      });
      expect(parsed.success).toBe(true);
    });
  });
});
