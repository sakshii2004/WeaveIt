import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators/auth';

describe('Auth Zod validators per PRD §8.1', () => {
  describe('signupSchema', () => {
    it('accepts valid signup data', () => {
      const result = signupSchema.safeParse({
        name: 'Maya Roy',
        email: 'maya@example.com',
        password: 'securePassword10',
      });
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 10 characters per PRD §8.1', () => {
      const result = signupSchema.safeParse({
        name: 'Maya Roy',
        email: 'maya@example.com',
        password: 'pass12345', // 9 characters
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password?.[0]).toContain('10 characters');
      }
    });

    it('rejects invalid emails', () => {
      const result = signupSchema.safeParse({
        name: 'Maya Roy',
        email: 'not-an-email',
        password: 'securePassword10',
      });
      expect(result.success).toBe(false);
    });

    it('rejects names shorter than 2 characters', () => {
      const result = signupSchema.safeParse({
        name: 'M',
        email: 'maya@example.com',
        password: 'securePassword10',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anyPassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('otpSchema', () => {
    it('accepts 6-digit numeric codes', () => {
      const result = otpSchema.safeParse({
        email: 'user@example.com',
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects codes that are not 6 digits', () => {
      expect(otpSchema.safeParse({ email: 'user@example.com', code: '12345' }).success).toBe(false);
      expect(otpSchema.safeParse({ email: 'user@example.com', code: '1234567' }).success).toBe(false);
    });

    it('rejects non-numeric characters in OTP', () => {
      const result = otpSchema.safeParse({
        email: 'user@example.com',
        code: '12345a',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'writer@weaveit.app' }).success).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts matching passwords with min 10 characters and 6-digit code', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'writer@weaveit.app',
        code: '492019',
        password: 'newSecurePassword123',
        confirmPassword: 'newSecurePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched confirmPassword', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'writer@weaveit.app',
        code: '492019',
        password: 'newSecurePassword123',
        confirmPassword: 'differentPassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toContain('match');
      }
    });
  });
});
