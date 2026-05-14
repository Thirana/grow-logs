import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[0-9]/, 'must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'must contain a special character'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  // min(1) only — strength rules are for registration; login must accept any stored password
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(1) });
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email: z.string().email() });
export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
