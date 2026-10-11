import { randomInt } from 'crypto';
import { hash, verify } from '@node-rs/argon2';

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a cryptographically secure 6-digit OTP string (e.g. "482910")
 */
export function generateOtp(): string {
  const code = randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Hash an OTP using argon2id per PRD §7.1
 */
export async function hashOtp(code: string): Promise<string> {
  return hash(code, {
    algorithm: 2, // Algorithm.Argon2id (value 2 in @node-rs/argon2)
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify a plain 6-digit OTP code against an argon2id hash
 */
export async function verifyOtp(hashString: string, code: string): Promise<boolean> {
  try {
    return await verify(hashString, code);
  } catch {
    return false;
  }
}

/**
 * Calculate expiration timestamp (10 minutes from now)
 */
export function getOtpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}
