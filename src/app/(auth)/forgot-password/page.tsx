import * as React from 'react';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | WeaveIt',
  description: 'Request a password reset verification code.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">
          Reset password
        </h1>
        <p className="text-sm text-ink-soft">
          Enter your email address and we will send you a 6-digit reset code.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
