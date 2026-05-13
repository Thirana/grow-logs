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
