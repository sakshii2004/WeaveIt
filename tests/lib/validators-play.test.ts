import { describe, it, expect } from 'vitest';
import {
  playBeatSchema,
  saveScenePlaySchema,
  BEAT_TYPES,
  type BeatType,
} from '@/lib/validators/play';
import { v7 as uuidv7 } from 'uuid';

describe('Play Validators (PRD §7.3, §8.6)', () => {
  describe('playBeatSchema', () => {
    it('accepts valid dialogue beat with characterId', () => {
      const charId = uuidv7();
      const beat = {
        id: uuidv7(),
        type: 'dialogue' as const,
        characterId: charId,
        text: 'You knew? All along, you knew?',
      };
      const parsed = playBeatSchema.safeParse(beat);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.type).toBe('dialogue');
        expect(parsed.data.characterId).toBe(charId);
        expect(parsed.data.text).toBe('You knew? All along, you knew?');
      }
    });

    it('accepts valid dialogue beat with null characterId (unassigned speaker)', () => {
      const beat = {
        id: uuidv7(),
        type: 'dialogue' as const,
        characterId: null,
        text: 'Who goes there?',
      };
      const parsed = playBeatSchema.safeParse(beat);
      expect(parsed.success).toBe(true);
    });

    it('accepts valid action beat', () => {
      const beat = {
        id: uuidv7(),
        type: 'action' as const,
        text: 'Arjun steps onto Platform 3 as steam fills the midnight air.',
      };
      const parsed = playBeatSchema.safeParse(beat);
      expect(parsed.success).toBe(true);
    });

    it('accepts valid narrator_note beat', () => {
      const beat = {
        id: uuidv7(),
        type: 'narrator_note' as const,
        text: 'The station clock has been stopped at 11:42 for three weeks.',
      };
      const parsed = playBeatSchema.safeParse(beat);
      expect(parsed.success).toBe(true);
    });

    it('accepts valid direction beat', () => {
      const beat = {
        id: uuidv7(),
        type: 'direction' as const,
        text: '(whispering, eyes darting toward the luggage car)',
      };
      const parsed = playBeatSchema.safeParse(beat);
      expect(parsed.success).toBe(true);
    });

    it('validates all allowed BEAT_TYPES', () => {
      for (const type of BEAT_TYPES) {
        const beat = {
          id: uuidv7(),
          type,
          text: 'Sample line',
        };
        expect(playBeatSchema.safeParse(beat).success).toBe(true);
      }
    });

    it('rejects invalid beat type', () => {
      const beat = {
        id: uuidv7(),
        type: 'invalid_type' as unknown as BeatType,
        text: 'Invalid line',
      };
      expect(playBeatSchema.safeParse(beat).success).toBe(false);
    });

    it('rejects invalid UUID for beat id', () => {
      const beat = {
        id: 'not-a-uuid',
        type: 'action' as const,
        text: 'Some action',
      };
      expect(playBeatSchema.safeParse(beat).success).toBe(false);
    });
  });

  describe('saveScenePlaySchema', () => {
    it('accepts empty beat array', () => {
      const payload = {
        content: [],
        purposeNote: 'Dramatic shift in trust.',
      };
      const parsed = saveScenePlaySchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('accepts array of multiple typed beats with purpose note', () => {
      const charId = uuidv7();
      const payload = {
        content: [
          {
            id: uuidv7(),
            type: 'action' as const,
            text: 'The stationmaster lowers his lantern.',
          },
          {
            id: uuidv7(),
            type: 'dialogue' as const,
            characterId: charId,
            text: 'The express is twenty minutes late.',
          },
          {
            id: uuidv7(),
            type: 'direction' as const,
            text: '(checking pocket watch)',
          },
          {
            id: uuidv7(),
            type: 'narrator_note' as const,
            text: 'Neither of them mentions the envelope in his satchel.',
          },
        ],
        purposeNote: 'Arjun realizes the schedule was deliberately altered.',
      };
      const parsed = saveScenePlaySchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.content).toHaveLength(4);
        expect(parsed.data.purposeNote).toBe(
          'Arjun realizes the schedule was deliberately altered.'
        );
      }
    });

    it('accepts null or omitted purposeNote', () => {
      const payload = {
        content: [],
        purposeNote: null,
      };
      expect(saveScenePlaySchema.safeParse(payload).success).toBe(true);
    });

    it('rejects purposeNote exceeding 5,000 characters', () => {
      const payload = {
        content: [],
        purposeNote: 'a'.repeat(5001),
      };
      expect(saveScenePlaySchema.safeParse(payload).success).toBe(false);
    });
  });
});
