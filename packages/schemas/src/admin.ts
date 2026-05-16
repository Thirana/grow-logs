import { z } from 'zod';

export const adminUserFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionStatus: z
    .enum(['FREE', 'ACTIVE', 'CANCELLED', 'PAST_DUE'])
    .optional(),
});

export type AdminUserFiltersDto = z.infer<typeof adminUserFiltersSchema>;

export const toggleFlagSchema = z.object({
  enabled: z.boolean(),
});

export type ToggleFlagDto = z.infer<typeof toggleFlagSchema>;
