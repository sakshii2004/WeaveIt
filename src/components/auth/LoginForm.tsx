'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const resetSuccess = searchParams.get('reset') === 'success';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes('EMAIL_NOT_VERIFIED')) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}&unverified=1`);
          return;
        }
        if (res.error.includes('Too many login attempts')) {
          setError('Too many login attempts. Please try again in 15 minutes.');
        } else {
          setError('Invalid email or password.');
        }
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {resetSuccess && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          Your password has been successfully reset. Please sign in with your new password.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-coral/10 border border-coral/20 p-3 text-xs text-coral font-medium">
          {error}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        placeholder="writer@weaveit.app"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <div className="space-y-1">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-brand hover:text-brand-strong transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full mt-2 font-medium"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
