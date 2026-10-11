import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Project title is required' })
    .max(120, { message: 'Title cannot exceed 120 characters' }),
  logline: z
    .string()
    .trim()
    .max(500, { message: 'Logline cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
  genre: z
    .string()
    .trim()
    .max(100, { message: 'Genre cannot exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Project title cannot be empty' })
    .max(120, { message: 'Title cannot exceed 120 characters' })
    .optional(),
  logline: z
    .string()
    .trim()
    .max(500, { message: 'Logline cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
  genre: z
    .string()
    .trim()
    .max(100, { message: 'Genre cannot exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const permanentDeleteProjectSchema = z.object({
  confirmTitle: z
    .string()
    .trim()
    .min(1, { message: 'Confirmation title is required' }),
});

export type PermanentDeleteProjectInput = z.infer<typeof permanentDeleteProjectSchema>;

export const quickAddSceneSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Scene title is required' })
    .max(255, { message: 'Scene title cannot exceed 255 characters' }),
});

export type QuickAddSceneInput = z.infer<typeof quickAddSceneSchema>;

export const viewportSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  })
  .nullable();

export type ViewportInput = z.infer<typeof viewportSchema>;
