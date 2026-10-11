import { z } from 'zod';

export const BEAT_TYPES = ['dialogue', 'action', 'narrator_note', 'direction'] as const;
export type BeatType = (typeof BEAT_TYPES)[number];

export const playBeatSchema = z.object({
  id: z.string().uuid('Invalid beat ID'),
  type: z.enum(BEAT_TYPES),
  characterId: z.string().uuid('Invalid character ID').nullable().optional(),
  text: z.string().max(10000, 'Beat text cannot exceed 10,000 characters'),
});

export type PlayBeat = z.infer<typeof playBeatSchema>;

export const saveScenePlaySchema = z.object({
  content: z.array(playBeatSchema),
  purposeNote: z.string().max(5000, 'Purpose note cannot exceed 5,000 characters').nullable().optional(),
});

export type SaveScenePlayInput = z.infer<typeof saveScenePlaySchema>;
