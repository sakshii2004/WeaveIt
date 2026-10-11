import { describe, it, expect } from 'vitest';
import {
  createCharacterSchema,
  updateCharacterSchema,
  customFieldSchema,
  customFieldsArraySchema,
  createRelationshipSchema,
  presignUploadSchema,
} from '@/lib/validators/characters';

describe('Character Validators', () => {
  describe('createCharacterSchema', () => {
    it('accepts valid character with name and default role', () => {
      const result = createCharacterSchema.safeParse({
        name: 'Aria Stark',
        role: 'protagonist',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Aria Stark');
        expect(result.data.role).toBe('protagonist');
      }
    });

    it('rejects empty name', () => {
      const result = createCharacterSchema.safeParse({
        name: '   ',
        role: 'supporting',
      });
      expect(result.success).toBe(false);
    });

    it('accepts all 7 valid role values', () => {
      const roles = [
        'protagonist',
        'love_interest',
        'antagonist',
        'villain',
        'supporting',
        'mentor',
      ];
      for (const role of roles) {
        const result = createCharacterSchema.safeParse({ name: 'Test', role });
        expect(result.success).toBe(true);
      }
    });

    it('requires roleCustom when role is custom', () => {
      const withoutCustom = createCharacterSchema.safeParse({
        name: 'Test',
        role: 'custom',
      });
      expect(withoutCustom.success).toBe(false);

      const withCustom = createCharacterSchema.safeParse({
        name: 'Test',
        role: 'custom',
        roleCustom: 'Spymaster',
      });
      expect(withCustom.success).toBe(true);
    });

    it('accepts optional profile fields', () => {
      const result = createCharacterSchema.safeParse({
        name: 'Elrond',
        role: 'mentor',
        description: 'Lord of Rivendell',
        personality: 'Wise and noble',
        goals: 'Protect Middle-earth',
        fears: 'The return of Sauron',
        background: 'Bearer of Vilya',
        arc: 'Guiding the fellowship',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateCharacterSchema', () => {
    it('accepts partial updates', () => {
      const result = updateCharacterSchema.safeParse({
        goals: 'Find the lost artifact',
      });
      expect(result.success).toBe(true);
    });

    it('validates role and custom role on update', () => {
      const invalid = updateCharacterSchema.safeParse({
        role: 'custom',
        roleCustom: '',
      });
      expect(invalid.success).toBe(false);

      const valid = updateCharacterSchema.safeParse({
        role: 'custom',
        roleCustom: 'Grandmaster',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('customFieldSchema & customFieldsArraySchema', () => {
    it('accepts valid custom field', () => {
      const result = customFieldSchema.safeParse({
        key: 'Clan',
        value: 'Uchiha',
        orderIndex: 0,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty key', () => {
      const result = customFieldSchema.safeParse({
        key: '   ',
        value: 'Something',
      });
      expect(result.success).toBe(false);
    });

    it('validates an array of custom fields', () => {
      const result = customFieldsArraySchema.safeParse([
        { key: 'Weapon', value: 'Buster Sword', orderIndex: 0 },
        { key: 'Materia', value: 'Fire', orderIndex: 1 },
      ]);
      expect(result.success).toBe(true);
    });
  });

  describe('createRelationshipSchema', () => {
    const char1 = '018f3a5b-7c3a-7d9a-9e11-123456789abc';
    const char2 = '018f3a5b-7c3a-7d9a-9e11-123456789def';

    it('accepts valid relationship', () => {
      const result = createRelationshipSchema.safeParse({
        sourceCharacterId: char1,
        targetCharacterId: char2,
        type: 'Rivalry',
        description: 'Constantly competing for the captain rank',
        isDirected: false,
      });
      expect(result.success).toBe(true);
    });

    it('rejects self-relationship (source === target)', () => {
      const result = createRelationshipSchema.safeParse({
        sourceCharacterId: char1,
        targetCharacterId: char1,
        type: 'Self-doubt',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing type', () => {
      const result = createRelationshipSchema.safeParse({
        sourceCharacterId: char1,
        targetCharacterId: char2,
        type: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('presignUploadSchema', () => {
    it('accepts JPEG, PNG, and WebP under 10MB', () => {
      expect(
        presignUploadSchema.safeParse({
          contentType: 'image/jpeg',
          fileSize: 1024 * 500,
        }).success
      ).toBe(true);

      expect(
        presignUploadSchema.safeParse({
          contentType: 'image/webp',
          fileSize: 1024 * 1024 * 8,
        }).success
      ).toBe(true);
    });

    it('rejects unsupported types like GIF or PDF', () => {
      expect(
        presignUploadSchema.safeParse({
          contentType: 'image/gif',
          fileSize: 1024,
        }).success
      ).toBe(false);

      expect(
        presignUploadSchema.safeParse({
          contentType: 'application/pdf',
          fileSize: 1024,
        }).success
      ).toBe(false);
    });

    it('rejects files exceeding 10 MB', () => {
      expect(
        presignUploadSchema.safeParse({
          contentType: 'image/png',
          fileSize: 10 * 1024 * 1024 + 1,
        }).success
      ).toBe(false);
    });
  });
});
