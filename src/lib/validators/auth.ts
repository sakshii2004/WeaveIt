import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(10, { message: 'Password must be at least 10 characters long' }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
  code: z
    .string()
    .length(6, { message: 'Verification code must be exactly 6 digits' })
    .regex(/^\d{6}$/, { message: 'Verification code must only contain digits' }),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const resendOtpSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
  purpose: z.enum(['verify_email', 'reset_password']),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .trim()
      .toLowerCase(),
    code: z
      .string()
      .length(6, { message: 'Verification code must be exactly 6 digits' })
      .regex(/^\d{6}$/, { message: 'Verification code must only contain digits' }),
    password: z
      .string()
      .min(10, { message: 'New password must be at least 10 characters long' }),
    confirmPassword: z
      .string()
      .min(10, { message: 'Please confirm your new password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
