'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { forgotPasswordAction } from '@/app/actions/auth';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);

    try {
      const res = await forgotPasswordAction(null, formData);
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setError(res.error || 'Failed to send reset code.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 text-left">
          <p className="font-semibold mb-1">Check your inbox</p>
          <p className="text-xs">
            If an account exists for <strong className="font-semibold">{email}</strong>, we have
            sent a 6-digit password reset code.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
        >
          Enter 6-digit reset code
        </Button>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="text-xs text-ink-soft hover:text-ink transition-colors font-medium"
          >
            &larr; Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        hint="We will send a 6-digit verification code to reset your password"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full font-medium"
      >
        {loading ? 'Sending code...' : 'Send reset code'}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs text-ink-soft hover:text-ink transition-colors font-medium"
        >
          &larr; Back to sign in
        </Link>
      </div>
    </form>
  );
}
