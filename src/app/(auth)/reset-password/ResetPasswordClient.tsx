'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
          Set new password
        </h1>
        <p className="text-sm text-ink-soft">
          Enter the 6-digit code sent to your email and your new password.
        </p>
      </div>

      <ResetPasswordForm initialEmail={email} />
    </div>
  );
}
