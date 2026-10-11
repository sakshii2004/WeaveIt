import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up | WeaveIt',
  description: 'Create an account to start planning your novel with WeaveIt.',
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
          Start your story
        </h1>
        <p className="text-sm text-ink-soft">
          Organize scenes, build characters, and craft your story arc.
        </p>
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      <AuthDivider />

      <SignupForm />

      <div className="text-center pt-2">
        <p className="text-xs text-ink-soft">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-brand hover:text-brand-strong font-medium underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
