import { z } from 'zod';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '../storage';

export const CHARACTER_ROLES = [
  'protagonist',
  'love_interest',
  'antagonist',
  'villain',
  'supporting',
  'mentor',
  'custom',
] as const;

export type CharacterRole = (typeof CHARACTER_ROLES)[number];

export const createCharacterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Character name is required')
      .max(120, 'Character name cannot exceed 120 characters'),
    role: z.enum(CHARACTER_ROLES).default('supporting'),
    roleCustom: z
      .string()
      .trim()
      .max(100, 'Custom role title cannot exceed 100 characters')
      .optional()
      .nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
    description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional().nullable(),
    personality: z.string().max(5000, 'Personality cannot exceed 5000 characters').optional().nullable(),
    goals: z.string().max(5000, 'Goals cannot exceed 5000 characters').optional().nullable(),
    fears: z.string().max(5000, 'Fears cannot exceed 5000 characters').optional().nullable(),
    background: z.string().max(5000, 'Background cannot exceed 5000 characters').optional().nullable(),
    arc: z.string().max(5000, 'Character arc cannot exceed 5000 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'custom' && (!data.roleCustom || data.roleCustom.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Please provide a custom role label',
      path: ['roleCustom'],
    }
  );

export const updateCharacterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Character name is required')
      .max(120, 'Character name cannot exceed 120 characters')
      .optional(),
    role: z.enum(CHARACTER_ROLES).optional(),
    roleCustom: z
      .string()
      .trim()
      .max(100, 'Custom role title cannot exceed 100 characters')
      .optional()
      .nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
    description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional().nullable(),
    personality: z.string().max(5000, 'Personality cannot exceed 5000 characters').optional().nullable(),
    goals: z.string().max(5000, 'Goals cannot exceed 5000 characters').optional().nullable(),
    fears: z.string().max(5000, 'Fears cannot exceed 5000 characters').optional().nullable(),
    background: z.string().max(5000, 'Background cannot exceed 5000 characters').optional().nullable(),
    arc: z.string().max(5000, 'Character arc cannot exceed 5000 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'custom' && (!data.roleCustom || data.roleCustom.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Please provide a custom role label',
      path: ['roleCustom'],
    }
  );

export const customFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Field attribute name is required')
    .max(100, 'Field attribute name cannot exceed 100 characters'),
  value: z
    .string()
    .max(2000, 'Field value cannot exceed 2000 characters')
    .default(''),
  orderIndex: z.number().int().min(0).default(0),
});

export const customFieldsArraySchema = z
  .array(customFieldSchema)
  .max(50, 'Cannot exceed 50 custom fields per character');

export const createRelationshipSchema = z
  .object({
    sourceCharacterId: z.string().uuid('Invalid source character ID'),
    targetCharacterId: z.string().uuid('Invalid target character ID'),
    type: z
      .string()
      .trim()
      .min(1, 'Relationship type is required')
      .max(100, 'Relationship type cannot exceed 100 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
    isDirected: z.boolean().default(true),
    startSceneId: z.string().uuid('Invalid start scene ID').optional().nullable(),
    endSceneId: z.string().uuid('Invalid end scene ID').optional().nullable(),
  })
  .refine((data) => data.sourceCharacterId !== data.targetCharacterId, {
    message: 'A character cannot have a relationship with themselves',
    path: ['targetCharacterId'],
  });

export const updateRelationshipSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1, 'Relationship type is required')
    .max(100, 'Relationship type cannot exceed 100 characters')
    .optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  isDirected: z.boolean().optional(),
  startSceneId: z.string().uuid('Invalid start scene ID').optional().nullable(),
  endSceneId: z.string().uuid('Invalid end scene ID').optional().nullable(),
});

export const presignUploadSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, 'File size exceeds 10 MB limit'),
});
