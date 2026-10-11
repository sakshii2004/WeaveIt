import { hash, verify } from '@node-rs/argon2';

/**
 * Hash password using argon2id per PRD §8.1
 */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, {
    algorithm: 2, // Algorithm.Argon2id (value 2 in @node-rs/argon2)
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify a plain password against an argon2id hash
 */
export async function verifyPassword(hashString: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashString, plain);
  } catch {
    return false;
  }
}
