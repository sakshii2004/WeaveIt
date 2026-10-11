import { describe, it, expect } from 'vitest';
import { authConfig } from '@/lib/auth';

describe('Auth.js Configuration with Credentials and Google OAuth', () => {
  it('registers credentials provider and google provider when env is present', () => {
    const providerIds = authConfig.providers.map((p) =>
      typeof p === 'function' ? p().id : p.id
    );

    expect(providerIds).toContain('credentials');
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      expect(providerIds).toContain('google');
    }
  });

  it('configures 30-day session maxAge and jwt strategy', () => {
    expect(authConfig.session?.strategy).toBe('jwt');
    expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it('points to custom login page', () => {
    expect(authConfig.pages?.signIn).toBe('/login');
    expect(authConfig.pages?.error).toBe('/login');
  });
});
