import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  permanentDeleteProjectSchema,
  quickAddSceneSchema,
  viewportSchema,
} from '@/lib/validators/projects';

describe('Project Zod Validators per PRD §8.2, §7.1, §7.3', () => {
  describe('createProjectSchema', () => {
    it('accepts valid project creation data', () => {
      const result = createProjectSchema.safeParse({
        title: 'The Jaipur Connection',
        logline: 'An investigator returns when a train arrives empty.',
        genre: 'Mystery / Thriller',
      });
      expect(result.success).toBe(true);
    });

    it('accepts project creation with only title', () => {
      const result = createProjectSchema.safeParse({
        title: 'Untitled Story',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createProjectSchema.safeParse({
        title: '   ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title?.[0]).toContain('required');
      }
    });

    it('rejects title longer than 120 characters', () => {
      const result = createProjectSchema.safeParse({
        title: 'A'.repeat(121),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('accepts partial updates', () => {
      const result = updateProjectSchema.safeParse({
        genre: 'Literary Fiction',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty string as title', () => {
      const result = updateProjectSchema.safeParse({
        title: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('permanentDeleteProjectSchema', () => {
    it('accepts non-empty confirmation title', () => {
      const result = permanentDeleteProjectSchema.safeParse({
        confirmTitle: 'The Jaipur Connection',
      });
      expect(result.success).toBe(true);
    });

    it('rejects whitespace-only confirmation title', () => {
      const result = permanentDeleteProjectSchema.safeParse({
        confirmTitle: '   ',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('quickAddSceneSchema', () => {
    it('accepts valid one-line seed scene', () => {
      const result = quickAddSceneSchema.safeParse({
        title: 'She runs into him at the Jaipur railway station',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty scene title', () => {
      const result = quickAddSceneSchema.safeParse({
        title: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('viewportSchema', () => {
    it('accepts null viewport', () => {
      const result = viewportSchema.safeParse(null);
      expect(result.success).toBe(true);
    });

    it('accepts valid viewport coordinate object', () => {
      const result = viewportSchema.safeParse({
        x: 100,
        y: 200,
        zoom: 1.5,
      });
      expect(result.success).toBe(true);
    });
  });
});
