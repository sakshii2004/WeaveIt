import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../db';
import { users, accounts, sessions, verificationTokens } from '../db/schema';
import { findUserByEmail } from '../db/queries/auth';
import { verifyPassword } from './passwords';
import { rateLimit } from './rate-limit';

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = String(credentials.email).toLowerCase().trim();
      const password = String(credentials.password);

      // Rate limit check: max 5 failed attempts per 15 min per PRD §8.1
      const rl = rateLimit({
        key: `login:${email}`,
        limit: 5,
        windowMs: 15 * 60 * 1000,
      });

      if (!rl.success) {
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }

      const user = await findUserByEmail(email);
      if (!user || !user.passwordHash) {
        return null;
      }

      const isPasswordValid = await verifyPassword(user.passwordHash, password);
      if (!isPasswordValid) {
        return null;
      }

      // Per PRD §8.1: Unverified email accounts cannot log in
      if (!user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

// Conditionally register Google provider if client ID and Secret are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  // Use DrizzleAdapter when DB connection is available; fallback to stateless JWT for stub mode
  adapter: db
    ? DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days rolling session per PRD §8.1
  },
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || 'weaveit-dev-secret-super-secure-32chars-minimum-key!',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
