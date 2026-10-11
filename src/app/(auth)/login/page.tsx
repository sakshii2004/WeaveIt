import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | WeaveIt',
  description: 'Sign in to WeaveIt, the scene-driven story planning app.',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="text-sm text-ink-soft">
          Pick up your manuscript where you left off.
        </p>
      </div>

      <GoogleSignInButton label="Continue with Google" />

      <AuthDivider />

      <React.Suspense fallback={<div className="h-40 animate-pulse bg-surface-sunken rounded-md" />}>
        <LoginForm />
      </React.Suspense>

      <div className="text-center pt-2">
        <p className="text-xs text-ink-soft">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-brand hover:text-brand-strong font-medium underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
