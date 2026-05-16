import { z } from 'zod';

const COLOR_PALETTE = [
  '#69B598',
  '#8285BA',
  '#B87DA2',
  '#C4A05E',
  '#62AEBF',
  '#B87060',
  '#7DB8B0',
  '#A87DB8',
] as const;

export const colorSchema = z.enum(COLOR_PALETTE);

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: colorSchema.optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    color: colorSchema.optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const categoryFiltersSchema = z.object({
  isCompleted: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const createSubcategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateSubcategorySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersDto = z.infer<typeof categoryFiltersSchema>;
export type CreateSubcategoryDto = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryDto = z.infer<typeof updateSubcategorySchema>;
export type ColorPalette = (typeof COLOR_PALETTE)[number];

export { COLOR_PALETTE };
