'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { verifyOtpAction, resendOtpAction } from '@/app/actions/auth';

export function OtpForm({
  email,
  unverifiedWarning = false,
}: {
  email: string;
  unverifiedWarning?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  // Countdown timer for resend cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('code', code);

    try {
      const res = await verifyOtpAction(null, formData);
      if (res.success) {
        setMessage('Email verified successfully! Redirecting to sign in...');
        setTimeout(() => {
          router.push('/login?verified=1');
        }, 1200);
      } else {
        setError(res.error || 'Verification failed. Please try again.');
        setIsVerifying(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setMessage(null);
    setIsResending(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('purpose', 'verify_email');

    try {
      const res = await resendOtpAction(null, formData);
      if (res.success) {
        setCooldown(res.data?.cooldownSeconds || 60);
        setMessage(res.message || 'A new code has been sent.');
      } else {
        setError(res.error || 'Failed to resend code.');
      }
    } catch {
      setError('Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {unverifiedWarning && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200">
          Your email address is not yet verified. Please enter the code sent to your email to continue.
        </div>
      )}

      {message && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-coral/10 border border-coral/20 p-3 text-xs text-coral font-medium text-center">
          {error}
        </div>
      )}

      <div className="py-2">
        <OtpInput
          value={code}
          onChange={(val) => {
            setCode(val);
            if (error) setError(null);
          }}
          disabled={isVerifying}
          hasError={Boolean(error)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isVerifying || code.length !== 6}
        className="w-full font-medium"
      >
        {isVerifying ? 'Verifying code...' : 'Verify code'}
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-ink-soft">
          Didn&apos;t receive the code?{' '}
          {cooldown > 0 ? (
            <span className="text-ink-soft font-mono font-medium">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-brand hover:text-brand-strong font-medium underline underline-offset-4 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </p>
      </div>
    </form>
  );
}
