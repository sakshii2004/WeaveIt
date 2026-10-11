import { eq, and, desc, gt } from 'drizzle-orm';
import { db } from '../index';
import { users, emailOtps, type User, type EmailOtp } from '../schema';
import { v7 as uuidv7 } from 'uuid';

// In-memory fallback store for stub mode (when DATABASE_URL is not yet configured)
const stubUsers = new Map<string, User>();
const stubOtps = new Map<string, EmailOtp>();

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  if (db) {
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    return result[0] ?? null;
  }

  for (const user of stubUsers.values()) {
    if (user.email.toLowerCase() === normalizedEmail) {
      return user;
    }
  }
  return null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (db) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? null;
  }
  return stubUsers.get(id) ?? null;
}

export async function createUser(data: {
  name?: string | null;
  email: string;
  passwordHash?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
}): Promise<User> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const id = uuidv7();
  const now = new Date();

  if (db) {
    const result = await db
      .insert(users)
      .values({
        id,
        name: data.name ?? null,
        email: normalizedEmail,
        passwordHash: data.passwordHash ?? null,
        image: data.image ?? null,
        emailVerified: data.emailVerified ?? null,
        themePref: 'system',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return result[0];
  }

  const newUser: User = {
    id,
    name: data.name ?? null,
    email: normalizedEmail,
    emailVerified: data.emailVerified ?? null,
    passwordHash: data.passwordHash ?? null,
    image: data.image ?? null,
    themePref: 'system',
    createdAt: now,
    updatedAt: now,
  };
  stubUsers.set(id, newUser);
  return newUser;
}

export async function createEmailOtp(data: {
  userId: string;
  codeHash: string;
  purpose: 'verify_email' | 'reset_password';
  expiresAt: Date;
}): Promise<EmailOtp> {
  const id = uuidv7();
  const now = new Date();

  if (db) {
    const result = await db
      .insert(emailOtps)
      .values({
        id,
        userId: data.userId,
        codeHash: data.codeHash,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        attempts: 0,
        consumedAt: null,
        createdAt: now,
      })
      .returning();
    return result[0];
  }

  const newOtp: EmailOtp = {
    id,
    userId: data.userId,
    codeHash: data.codeHash,
    purpose: data.purpose,
    expiresAt: data.expiresAt,
    attempts: 0,
    consumedAt: null,
    createdAt: now,
  };
  stubOtps.set(id, newOtp);
  return newOtp;
}

export async function findActiveOtp(
  userId: string,
  purpose: 'verify_email' | 'reset_password'
): Promise<EmailOtp | null> {
  const now = new Date();
  if (db) {
    const result = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.userId, userId),
          eq(emailOtps.purpose, purpose),
          gt(emailOtps.expiresAt, now)
        )
      )
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    const otp = result[0] ?? null;
    if (otp && !otp.consumedAt && otp.attempts < 5) {
      return otp;
    }
    return null;
  }

  const matching = Array.from(stubOtps.values())
    .filter(
      (o) =>
        o.userId === userId &&
        o.purpose === purpose &&
        !o.consumedAt &&
        o.expiresAt > now &&
        o.attempts < 5
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return matching[0] ?? null;
}

export async function findRecentOtp(
  userId: string,
  purpose: 'verify_email' | 'reset_password'
): Promise<EmailOtp | null> {
  if (db) {
    const result = await db
      .select()
      .from(emailOtps)
      .where(and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose)))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);
    return result[0] ?? null;
  }

  const matching = Array.from(stubOtps.values())
    .filter((o) => o.userId === userId && o.purpose === purpose)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return matching[0] ?? null;
}

export async function incrementOtpAttempts(otpId: string): Promise<number> {
  if (db) {
    const existing = await db
      .select({ attempts: emailOtps.attempts })
      .from(emailOtps)
      .where(eq(emailOtps.id, otpId))
      .limit(1);

    const current = existing[0]?.attempts ?? 0;
    const nextAttempts = current + 1;
    await db
      .update(emailOtps)
      .set({ attempts: nextAttempts })
      .where(eq(emailOtps.id, otpId));
    return nextAttempts;
  }

  const otp = stubOtps.get(otpId);
  if (!otp) return 0;
  otp.attempts += 1;
  stubOtps.set(otpId, otp);
  return otp.attempts;
}

export async function consumeOtp(otpId: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db
      .update(emailOtps)
      .set({ consumedAt: now })
      .where(eq(emailOtps.id, otpId));
    return;
  }

  const otp = stubOtps.get(otpId);
  if (otp) {
    otp.consumedAt = now;
    stubOtps.set(otpId, otp);
  }
}

export async function markEmailVerified(userId: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db
      .update(users)
      .set({ emailVerified: now, updatedAt: now })
      .where(eq(users.id, userId));
    return;
  }

  const user = stubUsers.get(userId);
  if (user) {
    user.emailVerified = now;
    user.updatedAt = now;
    stubUsers.set(userId, user);
  }
}

export async function updatePassword(userId: string, newHash: string): Promise<void> {
  const now = new Date();
  if (db) {
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: now })
      .where(eq(users.id, userId));
    return;
  }

  const user = stubUsers.get(userId);
  if (user) {
    user.passwordHash = newHash;
    user.updatedAt = now;
    stubUsers.set(userId, user);
  }
}

/**
 * Test helper to reset the stub store in unit/integration tests
 */
export function _resetStubStore(): void {
  stubUsers.clear();
  stubOtps.clear();
}
