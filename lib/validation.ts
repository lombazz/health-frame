import { z } from 'zod';

export const demographicsSchema = z.object({
  sex: z.enum(['M', 'F', 'X']),
  birth_year: z.number().min(1900).max(new Date().getFullYear()),
  height_cm: z.number().min(50).max(300),
  weight_kg: z.number().min(20).max(500),
});

export const labEntrySchema = z.object({
  analyte: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  ref_low: z.number().optional(),
  ref_high: z.number().optional(),
});

export const uploadRequestSchema = z.object({
  demographics: demographicsSchema,
  lab_results: z.array(labEntrySchema).min(1),
});
