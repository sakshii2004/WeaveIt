import { z } from 'zod';

export const STORY_COLORS = [
  'teal',
  'coral',
  'sun',
  'sky',
  'lavender',
  'mint',
  'rose',
  'slate',
] as const;

export type StoryColor = (typeof STORY_COLORS)[number];

/* Acts */
export const createActSchema = z.object({
  name: z.string().trim().min(1, 'Act name is required').max(100, 'Act name cannot exceed 100 characters'),
  color: z.string().trim().min(1, 'Act color is required'),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const updateActSchema = z.object({
  name: z.string().trim().min(1, 'Act name cannot be empty').max(100, 'Act name cannot exceed 100 characters').optional(),
  color: z.string().trim().min(1).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const reorderActsSchema = z.object({
  actIds: z.array(z.string().uuid('Invalid act ID')).min(1, 'Must provide at least one act ID'),
});

/* Chapters */
export const createChapterSchema = z.object({
  title: z.string().trim().min(1, 'Chapter title is required').max(120, 'Chapter title cannot exceed 120 characters'),
  mapId: z.string().uuid('Invalid map ID').optional().nullable(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const updateChapterSchema = z.object({
  title: z.string().trim().min(1, 'Chapter title cannot be empty').max(120, 'Chapter title cannot exceed 120 characters').optional(),
  orderIndex: z.number().int().nonnegative().optional(),
  mapId: z.string().uuid('Invalid map ID').optional().nullable(),
});

export const reorderChaptersSchema = z.object({
  chapterIds: z.array(z.string().uuid('Invalid chapter ID')).min(1, 'Must provide at least one chapter ID'),
});

/* Locations */
export const createLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(120, 'Location name cannot exceed 120 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
});

export const updateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name cannot be empty').max(120, 'Location name cannot exceed 120 characters').optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
});

/* Threads */
export const createThreadSchema = z.object({
  name: z.string().trim().min(1, 'Thread name is required').max(100, 'Thread name cannot exceed 100 characters'),
  color: z.string().trim().min(1, 'Color is required'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
});

export const updateThreadSchema = z.object({
  name: z.string().trim().min(1, 'Thread name cannot be empty').max(100, 'Thread name cannot exceed 100 characters').optional(),
  color: z.string().trim().min(1).optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
});
