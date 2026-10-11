import * as React from 'react';
import type { Metadata } from 'next';
import { VerifyEmailClient } from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify Email | WeaveIt',
  description: 'Enter your 6-digit verification code to complete registration.',
};

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 py-8 text-center text-ink-soft animate-pulse">
          Loading verification...
        </div>
      }
    >
      <VerifyEmailClient />
    </React.Suspense>
  );
}
