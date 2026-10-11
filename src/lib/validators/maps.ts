import { z } from 'zod';

export const MAP_KINDS = ['story', 'character', 'thread'] as const;
export type MapKind = (typeof MAP_KINDS)[number];

export const EDGE_TYPES = ['sequence', 'branch', 'cause', 'setup_payoff'] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

export const createMapSchema = z.object({
  name: z.string().trim().min(1, 'Map name is required').max(100, 'Map name cannot exceed 100 characters'),
  kind: z.enum(MAP_KINDS).default('story'),
  isDefault: z.boolean().optional(),
});
export type CreateMapInput = z.infer<typeof createMapSchema>;

export const updateMapSchema = z.object({
  name: z.string().trim().min(1, 'Map name cannot be empty').max(100, 'Map name cannot exceed 100 characters').optional(),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .nullable()
    .optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateMapInput = z.infer<typeof updateMapSchema>;

export const duplicateMapSchema = z.object({
  name: z.string().trim().max(100, 'Map name cannot exceed 100 characters').optional(),
});
export type DuplicateMapInput = z.infer<typeof duplicateMapSchema>;

export const addSceneToMapSchema = z.object({
  sceneId: z.string().uuid('Invalid scene ID'),
  x: z.number().default(100),
  y: z.number().default(100),
});
export type AddSceneToMapInput = z.infer<typeof addSceneToMapSchema>;

export const batchUpdateNodesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid('Invalid node ID'),
      x: z.number(),
      y: z.number(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
    })
  ),
});
export type BatchUpdateNodesInput = z.infer<typeof batchUpdateNodesSchema>;

export const createMapEdgeSchema = z.object({
  sourceNodeId: z.string().uuid('Invalid source node ID'),
  targetNodeId: z.string().uuid('Invalid target node ID'),
  edgeType: z.enum(EDGE_TYPES).default('sequence'),
  label: z.string().trim().max(100, 'Label cannot exceed 100 characters').nullable().optional(),
});
export type CreateMapEdgeInput = z.infer<typeof createMapEdgeSchema>;

export const updateMapEdgeSchema = z.object({
  edgeType: z.enum(EDGE_TYPES).optional(),
  label: z.string().trim().max(100, 'Label cannot exceed 100 characters').nullable().optional(),
});
export type UpdateMapEdgeInput = z.infer<typeof updateMapEdgeSchema>;

export const reorderSequenceSchema = z.object({
  orderedNodeIds: z.array(z.string().uuid('Invalid node ID')),
});
export type ReorderSequenceInput = z.infer<typeof reorderSequenceSchema>;

export const createMapGroupSchema = z.object({
  label: z.string().trim().min(1, 'Group label is required').max(100, 'Label cannot exceed 100 characters'),
  color: z.string().default('slate'),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(400),
  height: z.number().default(300),
});
export type CreateMapGroupInput = z.infer<typeof createMapGroupSchema>;

export const updateMapGroupSchema = z.object({
  label: z.string().trim().min(1, 'Group label cannot be empty').max(100).optional(),
  color: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type UpdateMapGroupInput = z.infer<typeof updateMapGroupSchema>;
