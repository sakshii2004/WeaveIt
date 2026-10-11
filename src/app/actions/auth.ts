'use server';

import {
  signupSchema,
  otpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators/auth';
import {
  findUserByEmail,
  createUser,
  createEmailOtp,
  findActiveOtp,
  findRecentOtp,
  incrementOtpAttempts,
  consumeOtp,
  markEmailVerified,
  updatePassword,
} from '@/db/queries/auth';
import { hashPassword } from '@/lib/passwords';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiresAt,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { signOut } from '@/lib/auth';

export type ActionState<T = unknown> = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
  message?: string;
};

/**
 * Sign up action per PRD §8.1
 */
export async function signupAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ email: string }>> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validation = signupSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
      error: 'Please fix the errors in the form.',
    };
  }

  const { name, email, password } = validation.data;

  // Rate limit signups by email (max 3 attempts per 10 min)
  const rl = rateLimit({ key: `signup:${email}`, limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return {
      success: false,
      error: 'Too many signup attempts. Please try again later.',
    };
  }

  const existingUser = await findUserByEmail(email);
  let userId: string;

  if (existingUser) {
    if (existingUser.emailVerified) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.',
      };
    }
    // Existing unverified account: update password and issue a fresh OTP
    userId = existingUser.id;
    const newHash = await hashPassword(password);
    await updatePassword(userId, newHash);
  } else {
    // Create new unverified user
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      name,
      email,
      passwordHash,
    });
    userId = user.id;
  }

  // Generate and send 6-digit OTP
  const rawOtp = generateOtp();
  const codeHash = await hashOtp(rawOtp);
  await createEmailOtp({
    userId,
    codeHash,
    purpose: 'verify_email',
    expiresAt: getOtpExpiresAt(),
  });

  await sendOtpEmail({
    to: email,
    code: rawOtp,
    purpose: 'verify_email',
  });

  return {
    success: true,
    data: { email },
    message: 'Verification code sent. Please check your email.',
  };
}

/**
 * Verify OTP action per PRD §7.1 and §8.1
 */
export async function verifyOtpAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get('email'),
    code: formData.get('code'),
  };

  const validation = otpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
      error: 'Please enter a valid 6-digit code.',
    };
  }

  const { email, code } = validation.data;
  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      error: 'No account found for this email address.',
    };
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: 'Email is already verified. You can now sign in.',
    };
  }

  const activeOtp = await findActiveOtp(user.id, 'verify_email');
  if (!activeOtp) {
    return {
      success: false,
      error: 'The verification code has expired or is invalid. Please request a new code.',
    };
  }

  const isValid = await verifyOtp(activeOtp.codeHash, code);
  if (!isValid) {
    const attempts = await incrementOtpAttempts(activeOtp.id);
    const remaining = 5 - attempts;

    if (remaining <= 0) {
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
      };
    }

    return {
      success: false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Consume OTP and mark email verified
  await consumeOtp(activeOtp.id);
  await markEmailVerified(user.id);

  return {
    success: true,
    message: 'Your email has been verified! You can now log in.',
  };
}

/**
 * Resend OTP action with 60-second cooldown per PRD §8.1
 */
export async function resendOtpAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ cooldownSeconds: number }>> {
  const rawData = {
    email: formData.get('email'),
    purpose: formData.get('purpose'),
  };

  const validation = resendOtpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid request data.',
    };
  }

  const { email, purpose } = validation.data;
  const user = await findUserByEmail(email);

  if (!user) {
    // Return success to avoid email enumeration
    return {
      success: true,
      data: { cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS },
      message: 'If the account exists, a new code has been sent.',
    };
  }

  // Check 60-second cooldown
  const recentOtp = await findRecentOtp(user.id, purpose);
  if (recentOtp) {
    const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitTime = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        error: `Please wait ${waitTime} second${waitTime === 1 ? '' : 's'} before requesting another code.`,
      };
    }
  }

  // Rate limit: max 4 resends per hour
  const rl = rateLimit({ key: `resend:${email}`, limit: 4, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return {
      success: false,
      error: 'Too many requests. Please wait an hour before requesting another code.',
    };
  }

  const rawOtp = generateOtp();
  const codeHash = await hashOtp(rawOtp);
  await createEmailOtp({
    userId: user.id,
    purpose,
    codeHash,
    expiresAt: getOtpExpiresAt(),
  });

  await sendOtpEmail({
    to: email,
    code: rawOtp,
    purpose,
  });

  return {
    success: true,
    data: { cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS },
    message: 'A fresh verification code has been sent to your email.',
  };
}

/**
 * Forgot password action with anti-enumeration protection per PRD §8.1
 */
export async function forgotPasswordAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState<{ email: string }>> {
  const rawData = { email: formData.get('email') };
  const validation = forgotPasswordSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
      error: 'Please enter a valid email address.',
    };
  }

  const { email } = validation.data;

  // Always return identical success response to prevent email enumeration
  const genericSuccess = {
    success: true,
    data: { email },
    message: 'If an account exists with that email, a password reset code has been sent.',
  };

  // Rate limit: max 3 per 15 minutes
  const rl = rateLimit({ key: `forgot:${email}`, limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return {
      success: false,
      error: 'Too many password reset requests. Please try again later.',
    };
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return genericSuccess;
  }

  const rawOtp = generateOtp();
  const codeHash = await hashOtp(rawOtp);
  await createEmailOtp({
    userId: user.id,
    codeHash,
    purpose: 'reset_password',
    expiresAt: getOtpExpiresAt(),
  });

  await sendOtpEmail({
    to: email,
    code: rawOtp,
    purpose: 'reset_password',
  });

  return genericSuccess;
}

/**
 * Reset password action per PRD §8.1
 */
export async function resetPasswordAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get('email'),
    code: formData.get('code'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const validation = resetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
      error: 'Please fix the errors below.',
    };
  }

  const { email, code, password } = validation.data;
  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      error: 'Invalid or expired reset code.',
    };
  }

  const activeOtp = await findActiveOtp(user.id, 'reset_password');
  if (!activeOtp) {
    return {
      success: false,
      error: 'The reset code has expired or is invalid. Please request a new one.',
    };
  }

  const isValid = await verifyOtp(activeOtp.codeHash, code);
  if (!isValid) {
    const attempts = await incrementOtpAttempts(activeOtp.id);
    const remaining = 5 - attempts;

    if (remaining <= 0) {
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new reset code.',
      };
    }

    return {
      success: false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Consume OTP and update password
  await consumeOtp(activeOtp.id);
  const newHash = await hashPassword(password);
  await updatePassword(user.id, newHash);

  // If user was unverified, reset verifies their email as well
  if (!user.emailVerified) {
    await markEmailVerified(user.id);
  }

  return {
    success: true,
    message: 'Your password has been successfully reset! You can now sign in.',
  };
}

/**
 * Sign out action
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
