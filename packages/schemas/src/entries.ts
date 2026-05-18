import { z } from "zod";
import { dateStringSchema } from "./common.js";

export const entryTypeSchema = z.enum(["WORK", "LEARNING"]);

export const createEntrySchema = z.object({
  type: entryTypeSchema,
  text: z
    .string()
    .min(10, "Entry must be at least 10 characters")
    .max(1000, "Entry must be 1 000 characters or less"),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional().nullable(),
  productivityScore: z.number().int().min(1).max(10).optional(),
  entryDate: dateStringSchema.optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const entryFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: entryTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

export const summaryQuerySchema = z.object({
  period: z.enum(["7d", "30d", "all"]).default("30d"),
  type: entryTypeSchema.optional(),
});

export type EntryTypeDto = z.infer<typeof entryTypeSchema>;
export type CreateEntryDto = z.infer<typeof createEntrySchema>;
export type UpdateEntryDto = z.infer<typeof updateEntrySchema>;
export type EntryFiltersDto = z.infer<typeof entryFiltersSchema>;
export type SummaryQueryDto = z.infer<typeof summaryQuerySchema>;
