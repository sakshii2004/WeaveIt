import { describe, it, expect } from 'vitest';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiresAt,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';

describe('OTP utility per PRD §7.1 and §8.1', () => {
  it('generates a 6-digit numeric string', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    }
  });

  it('hashes and verifies OTP using argon2id', async () => {
    const code = '583921';
    const hash = await hashOtp(code);

    expect(hash).toContain('$argon2id$');
    const isValid = await verifyOtp(hash, code);
    expect(isValid).toBe(true);

    const isInvalid = await verifyOtp(hash, '123456');
    expect(isInvalid).toBe(false);
  });

  it('calculates expiry 10 minutes in the future', () => {
    const before = Date.now();
    const expiresAt = getOtpExpiresAt();
    const after = Date.now();

    const expectedMs = OTP_EXPIRY_MINUTES * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + expectedMs);
  });

  it('matches constants specified in PRD', () => {
    expect(OTP_EXPIRY_MINUTES).toBe(10);
    expect(OTP_MAX_ATTEMPTS).toBe(5);
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});
