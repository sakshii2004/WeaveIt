import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/passwords';

describe('passwords utility (argon2id)', () => {
  it('hashes a password using argon2id and verifies successfully', async () => {
    const plain = 'superSecurePass123!';
    const hash = await hashPassword(plain);

    expect(hash).toContain('$argon2id$');
    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password verification', async () => {
    const hash = await hashPassword('correctPassword10');
    const isValid = await verifyPassword(hash, 'wrongPassword10');
    expect(isValid).toBe(false);
  });

  it('handles invalid hash strings gracefully without crashing', async () => {
    const isValid = await verifyPassword('not-a-valid-argon2-hash', 'password');
    expect(isValid).toBe(false);
  });
});
