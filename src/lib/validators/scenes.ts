import { z } from 'zod';

export const SCENE_STATUSES = ['seed', 'sketched', 'planned', 'played', 'drafted'] as const;
export type SceneStatus = (typeof SCENE_STATUSES)[number];

export const SCENE_TYPES = [
  'setup',
  'inciting',
  'escalation',
  'reveal',
  'twist',
  'turning_point',
  'midpoint',
  'climax',
  'resolution',
  'connective',
  'other',
] as const;
export type SceneType = (typeof SCENE_TYPES)[number];

export const createSceneSchema = z
  .object({
    title: z.string().trim().max(255, 'Title cannot exceed 255 characters').optional().or(z.literal('')),
    description: z.string().max(20000, 'Description cannot exceed 20,000 characters').optional().nullable(),
    status: z.enum(SCENE_STATUSES).default('seed'),
    sceneType: z.enum(SCENE_TYPES).optional().nullable(),
    purpose: z.string().max(5000, 'Purpose note cannot exceed 5,000 characters').optional().nullable(),
    locationId: z.string().uuid('Invalid location ID').optional().nullable().or(z.literal('')),
    chapterId: z.string().uuid('Invalid chapter ID').optional().nullable().or(z.literal('')),
    actId: z.string().uuid('Invalid act ID').optional().nullable().or(z.literal('')),
    timeLabel: z.string().trim().max(100, 'Time label cannot exceed 100 characters').optional().nullable(),
    color: z.string().trim().max(50).optional().nullable(),
    characters: z
      .array(
        z.object({
          characterId: z.string().uuid('Invalid character ID'),
          roleInScene: z.string().trim().max(255).optional().nullable(),
        })
      )
      .optional(),
    threadIds: z.array(z.string().uuid('Invalid thread ID')).optional(),
  })
  .refine(
    (data) => {
      const hasTitle = Boolean(data.title && data.title.trim().length > 0);
      const hasDescription = Boolean(data.description && data.description.trim().length > 0);
      return hasTitle || hasDescription;
    },
    {
      message: 'A scene must have at least a title or a description fragment',
      path: ['title'],
    }
  );

export type CreateSceneInput = z.infer<typeof createSceneSchema>;

export const updateSceneSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255, 'Title cannot exceed 255 characters').optional(),
  description: z.string().max(20000, 'Description cannot exceed 20,000 characters').optional().nullable(),
  status: z.enum(SCENE_STATUSES).optional(),
  sceneType: z.enum(SCENE_TYPES).optional().nullable(),
  purpose: z.string().max(5000, 'Purpose note cannot exceed 5,000 characters').optional().nullable(),
  locationId: z.string().uuid('Invalid location ID').optional().nullable().or(z.literal('')),
  chapterId: z.string().uuid('Invalid chapter ID').optional().nullable().or(z.literal('')),
  actId: z.string().uuid('Invalid act ID').optional().nullable().or(z.literal('')),
  timeLabel: z.string().trim().max(100, 'Time label cannot exceed 100 characters').optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  characters: z
    .array(
      z.object({
        characterId: z.string().uuid('Invalid character ID'),
        roleInScene: z.string().trim().max(255).optional().nullable(),
      })
    )
    .optional(),
  threadIds: z.array(z.string().uuid('Invalid thread ID')).optional(),
});

export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;

export const sceneFiltersSchema = z.object({
  status: z.union([z.string(), z.array(z.string())]).optional(),
  actId: z.string().optional(),
  chapterId: z.string().optional(),
  threadId: z.string().optional(),
  characterId: z.string().optional(),
  search: z.string().optional(),
  includeDeleted: z.boolean().optional(),
});

export type SceneFiltersInput = z.infer<typeof sceneFiltersSchema>;
