import { z } from 'zod';

export const cashEntrySchema = z.object({
  entryType: z.enum(['IN', 'OUT']),
  category: z.enum(['EXPENSE', 'PURCHASE', 'OTHER']),
  description: z.string().trim().min(2).max(240),
  amount: z.coerce.number().positive(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
