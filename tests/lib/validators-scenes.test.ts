import { describe, it, expect } from 'vitest';
import {
  createSceneSchema,
  updateSceneSchema,
  sceneFiltersSchema,
  SCENE_STATUSES,
  SCENE_TYPES,
} from '@/lib/validators/scenes';
import { v7 as uuidv7 } from 'uuid';

describe('Scenes Validators', () => {
  describe('createSceneSchema', () => {
    it('accepts valid scene with title and defaults status to seed', () => {
      const parsed = createSceneSchema.safeParse({
        title: 'She runs into him at the Jaipur railway station',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.title).toBe('She runs into him at the Jaipur railway station');
        expect(parsed.data.status).toBe('seed');
      }
    });

    it('accepts single-sentence fragment in description when title is empty', () => {
      const parsed = createSceneSchema.safeParse({
        title: '',
        description: 'Steam hisses across Platform 3. She notices the red seal on his envelope.',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects when both title and description are missing or whitespace', () => {
      const parsed = createSceneSchema.safeParse({
        title: '   ',
        description: '   ',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates all allowed status values', () => {
      for (const status of SCENE_STATUSES) {
        const parsed = createSceneSchema.safeParse({
          title: 'A scene',
          status,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('rejects invalid status values', () => {
      const parsed = createSceneSchema.safeParse({
        title: 'A scene',
        status: 'invalid_status' as unknown as 'seed',
      });
      expect(parsed.success).toBe(false);
    });

    it('validates all allowed sceneType values', () => {
      for (const sceneType of SCENE_TYPES) {
        const parsed = createSceneSchema.safeParse({
          title: 'A scene',
          sceneType,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('accepts character joins and thread joins', () => {
      const charId = uuidv7();
      const threadId = uuidv7();

      const parsed = createSceneSchema.safeParse({
        title: 'The Interrogation',
        characters: [{ characterId: charId, roleInScene: 'Chief Investigator' }],
        threadIds: [threadId],
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.characters?.[0].roleInScene).toBe('Chief Investigator');
        expect(parsed.data.threadIds?.[0]).toBe(threadId);
      }
    });
  });

  describe('updateSceneSchema', () => {
    it('allows partial field updates', () => {
      const parsed = updateSceneSchema.safeParse({
        status: 'planned',
        purpose: 'The reader learns who forged the will.',
        timeLabel: 'Day 2, Noon',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.status).toBe('planned');
      }
    });

    it('rejects empty title string on update', () => {
      const parsed = updateSceneSchema.safeParse({
        title: '',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('sceneFiltersSchema', () => {
    it('parses multi-dimensional filters cleanly', () => {
      const parsed = sceneFiltersSchema.safeParse({
        status: 'seed',
        actId: uuidv7(),
        search: 'Jaipur',
      });
      expect(parsed.success).toBe(true);
    });
  });
});
