import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).optional().default(3000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .optional()
      .default('development'),
    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'debug', 'verbose'])
      .optional()
      .default('info'),
    LOG_FORMAT: z.enum(['pretty', 'json']).optional(),
    DATABASE_URL: z.string().min(1),
    SENTRY_DSN: z.string().optional(),
    FRONTEND_URL: z.string().optional().default('http://localhost:3001'),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().optional().default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(20).optional().default(12),
  })
  .transform((data) => ({
    ...data,
    LOG_FORMAT:
      data.LOG_FORMAT ?? (data.NODE_ENV === 'production' ? 'json' : 'pretty'),
  }));

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Environment validation failed — ${messages}`);
  }
  return result.data;
}
