import { describe, it, expect, beforeAll } from 'vitest';
import {
  createUser,
  findUserByEmail,
  createEmailOtp,
  findActiveOtp,
  incrementOtpAttempts,
  consumeOtp,
  markEmailVerified,
  updatePassword,
} from '@/db/queries/auth';
import { hashPassword, verifyPassword } from '@/lib/passwords';
import { generateOtp, hashOtp, verifyOtp, getOtpExpiresAt } from '@/lib/otp';
import { db } from '@/db';

describe('Neon Postgres Live DB Auth Operations', () => {
  const testEmail = `test_${Date.now()}@weaveit.test`;

  beforeAll(() => {
    if (!db) {
      console.warn('DATABASE_URL is not set; running with stub fallback.');
    }
  });

  it('creates and finds a user in the database', async () => {
    const rawPassword = 'SecurePassword123!';
    const passwordHash = await hashPassword(rawPassword);

    const user = await createUser({
      name: 'Maya Test',
      email: testEmail,
      passwordHash,
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail.toLowerCase());
    expect(user.name).toBe('Maya Test');
    expect(user.emailVerified).toBeNull();

    const found = await findUserByEmail(testEmail);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);

    const isMatch = await verifyPassword(found!.passwordHash!, rawPassword);
    expect(isMatch).toBe(true);
  });

  it('manages OTP lifecycle for the user in the database', async () => {
    const user = await findUserByEmail(testEmail);
    expect(user).not.toBeNull();

    const rawOtp = generateOtp();
    const codeHash = await hashOtp(rawOtp);
    const expiresAt = getOtpExpiresAt();

    const otp = await createEmailOtp({
      userId: user!.id,
      codeHash,
      purpose: 'verify_email',
      expiresAt,
    });

    expect(otp.id).toBeDefined();
    expect(otp.attempts).toBe(0);

    const activeOtp = await findActiveOtp(user!.id, 'verify_email');
    expect(activeOtp).not.toBeNull();
    expect(activeOtp?.id).toBe(otp.id);

    // Verify correct code
    const isCodeValid = await verifyOtp(activeOtp!.codeHash, rawOtp);
    expect(isCodeValid).toBe(true);

    // Increment attempts
    const newAttempts = await incrementOtpAttempts(otp.id);
    expect(newAttempts).toBe(1);

    // Consume OTP
    await consumeOtp(otp.id);
    const consumed = await findActiveOtp(user!.id, 'verify_email');
    expect(consumed).toBeNull();
  });

  it('marks email verified and updates password', async () => {
    const user = await findUserByEmail(testEmail);
    expect(user).not.toBeNull();

    await markEmailVerified(user!.id);
    const verifiedUser = await findUserByEmail(testEmail);
    expect(verifiedUser?.emailVerified).not.toBeNull();

    const newPassword = 'BrandNewPassword456!';
    const newHash = await hashPassword(newPassword);
    await updatePassword(user!.id, newHash);

    const updatedUser = await findUserByEmail(testEmail);
    const isNewMatch = await verifyPassword(updatedUser!.passwordHash!, newPassword);
    expect(isNewMatch).toBe(true);
  });
});
