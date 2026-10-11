import { describe, it, expect } from 'vitest';
import {
  createMapSchema,
  updateMapSchema,
  createMapEdgeSchema,
  reorderSequenceSchema,
  createMapGroupSchema,
} from '@/lib/validators/maps';

describe('Map Validators (Zod Schemas)', () => {
  it('validates valid createMap data', () => {
    const valid = { name: 'Act II Outline', kind: 'story' };
    const res = createMapSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects empty map name', () => {
    const invalid = { name: '   ' };
    const res = createMapSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates map update data', () => {
    const valid = { name: 'Act II - Revised', isDefault: false };
    const res = updateMapSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('validates edge creation with default sequence type', () => {
    const edge = {
      sourceNodeId: '11111111-1111-4111-a111-111111111111',
      targetNodeId: '22222222-2222-4222-a222-222222222222',
    };
    const res = createMapEdgeSchema.safeParse(edge);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.edgeType).toBe('sequence');
    }
  });

  it('rejects invalid UUIDs in edge creation', () => {
    const edge = {
      sourceNodeId: 'not-a-uuid',
      targetNodeId: '22222222-2222-4222-a222-222222222222',
    };
    const res = createMapEdgeSchema.safeParse(edge);
    expect(res.success).toBe(false);
  });

  it('validates sequence reordering array', () => {
    const data = {
      orderedNodeIds: [
        '11111111-1111-4111-a111-111111111111',
        '22222222-2222-4222-a222-222222222222',
      ],
    };
    const res = reorderSequenceSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('validates map group creation defaults', () => {
    const group = { label: 'Midpoint Climax' };
    const res = createMapGroupSchema.safeParse(group);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.color).toBe('slate');
      expect(res.data.width).toBe(400);
      expect(res.data.height).toBe(300);
    }
  });
});
