import { z } from 'zod';

const nullableText = z.string().trim().max(120).optional().nullable();

export const productSchema = z.object({
  type: z.enum(['TIRE', 'WHEEL', 'VALVE']),
  brand: nullableText,
  model: nullableText,
  name: nullableText,
  tireWidth: nullableText,
  tireHeight: nullableText,
  rim: nullableText,
  tireCondition: z.enum(['NOVO', 'REMODELADO']).optional().nullable(),
  boltPattern: nullableText,
  wheelWidth: nullableText,
  valveType: nullableText,
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  minimumQuantity: z.coerce.number().int().min(0),
});

export const stockMovementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().min(0),
  reason: z.string().trim().max(240).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
