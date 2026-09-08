import { z } from 'zod';

export const saleSchema = z.object({
  vehiclePlate: z.string().trim().max(12).optional().nullable(),
  vehicleModel: z.string().trim().max(120).optional().nullable(),
  paymentMethod: z.enum(['CASH', 'PIX', 'CARD', 'OTHER']),
  cardInstallments: z.coerce.number().int().min(1).max(12).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  discountType: z.enum(['FIXED', 'PERCENT']).optional().nullable(),
  discountValue: z.coerce.number().min(0).default(0),
  items: z.array(z.object({
    itemType: z.enum(['PRODUCT', 'SERVICE', 'LABOR', 'PART']),
    productId: z.coerce.number().int().positive().optional().nullable(),
    serviceCode: z.enum(['ALIGNMENT', 'BALANCING']).optional().nullable(),
    description: z.string().trim().min(1).max(240),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
    unitCost: z.coerce.number().min(0).optional(),
  })).min(1),
}).superRefine((value, context) => {
  value.items.forEach((item, index) => {
    if (item.itemType === 'PRODUCT' && !item.productId) context.addIssue({ code: 'custom', path: ['items', index, 'productId'], message: 'Produto é obrigatório.' });
    if (item.itemType === 'SERVICE' && !item.serviceCode) context.addIssue({ code: 'custom', path: ['items', index, 'serviceCode'], message: 'Serviço tabelado é obrigatório.' });
    if (item.itemType === 'PART' && item.unitCost === undefined) context.addIssue({ code: 'custom', path: ['items', index, 'unitCost'], message: 'Custo da peça é obrigatório.' });
  });
  if (value.paymentMethod === 'CARD' && !value.cardInstallments) context.addIssue({ code: 'custom', path: ['cardInstallments'], message: 'Informe a quantidade de parcelas do cartão.' });
  if (value.discountType === 'PERCENT' && value.discountValue > 100) context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Desconto percentual deve ser de no máximo 100%.' });
});

export type SaleInput = z.infer<typeof saleSchema>;
