'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { signupAction } from '@/app/actions/auth';

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState(signupAction, null);

  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (state?.success && state.data?.email) {
      router.push(`/verify-email?email=${encodeURIComponent(state.data.email)}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-coral/10 border border-coral/20 p-3 text-xs text-coral font-medium">
          {state.error}
        </div>
      )}

      <Input
        name="name"
        label="Full Name"
        type="text"
        placeholder="Maya Roy"
        autoComplete="name"
        required
        disabled={isPending}
        error={state?.fieldErrors?.name?.[0]}
      />

      <Input
        name="email"
        label="Email address"
        type="email"
        placeholder="writer@weaveit.app"
        autoComplete="email"
        required
        disabled={isPending}
        error={state?.fieldErrors?.email?.[0]}
      />

      <div className="space-y-1">
        <Input
          name="password"
          label="Password"
          type="password"
          placeholder="At least 10 characters"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          error={state?.fieldErrors?.password?.[0]}
          hint="Minimum 10 characters"
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending}
        className="w-full mt-2 font-medium"
      >
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
