import * as React from 'react';
import type { Metadata } from 'next';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | WeaveIt',
  description: 'Enter your reset code and set a new password.',
};

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 py-8 text-center text-ink-soft animate-pulse">
          Loading reset form...
        </div>
      }
    >
      <ResetPasswordClient />
    </React.Suspense>
  );
}
