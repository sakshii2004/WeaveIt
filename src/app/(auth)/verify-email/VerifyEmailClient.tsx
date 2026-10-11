'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OtpForm } from '@/components/auth/OtpForm';

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const unverified = searchParams.get('unverified') === '1';

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
          Verify your email
        </h1>
        <p className="text-sm text-ink-soft">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-ink break-all">
            {email || 'your email address'}
          </span>
          .
        </p>
      </div>

      <OtpForm email={email} unverifiedWarning={unverified} />

      <div className="text-center pt-2 border-t border-line">
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
