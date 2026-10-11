'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { resetPasswordAction } from '@/app/actions/auth';

export function ResetPasswordForm({ initialEmail = '' }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email || !code || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('code', code);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    try {
      const res = await resetPasswordAction(null, formData);
      if (res.success) {
        router.push('/login?reset=success');
      } else {
        setError(res.error || 'Failed to reset password.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-coral/10 border border-coral/20 p-3 text-xs text-coral font-medium text-center">
          {error}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        placeholder="writer@weaveit.app"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        error={fieldErrors.email?.[0]}
      />

      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          6-Digit Reset Code
        </label>
        <OtpInput
          value={code}
          onChange={(val) => {
            setCode(val);
            if (error) setError(null);
          }}
          disabled={loading}
          hasError={Boolean(fieldErrors.code?.[0])}
        />
        {fieldErrors.code?.[0] && (
          <p className="text-xs text-coral font-medium text-center">{fieldErrors.code[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Input
          label="New Password"
          type="password"
          placeholder="At least 10 characters"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          error={fieldErrors.password?.[0]}
          hint="Minimum 10 characters"
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="Re-enter your new password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        error={fieldErrors.confirmPassword?.[0]}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading || code.length !== 6}
        className="w-full mt-2 font-medium"
      >
        {loading ? 'Updating password...' : 'Reset password'}
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
