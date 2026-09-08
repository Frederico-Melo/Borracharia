import { randomUUID } from 'node:crypto';
import { SaleInput } from '../dtos/sale.dto';
import { AppError } from '../lib/errors';
import { localDate, localDateTime } from '../lib/date';
import { fromCents, toCents } from '../lib/money';
import { calculateCardPayment } from '../../../shared/card';
import { DatabaseManager } from '../lib/database';
import { CashRepository } from '../repositories/cash.repository';
import { ProductRepository } from '../repositories/product.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { ServiceRepository } from '../repositories/service.repository';

const saleView = (sale: any) => sale && ({
  id: sale.id, saleNumber: sale.sale_number, vehiclePlate: sale.vehicle_plate, vehicleModel: sale.vehicle_model,
  subtotal: fromCents(sale.subtotal_cents), discountType: sale.discount_type,
  discountValue: sale.discount_type === 'PERCENT' ? sale.discount_value / 100 : fromCents(sale.discount_value),
  discount: fromCents(sale.discount_cents), total: fromCents(sale.total_cents), profit: fromCents(sale.profit_cents),
  paymentMethod: sale.payment_method, cardInstallments: sale.card_installments,
  cardFeeRate: sale.card_fee_bps === null || sale.card_fee_bps === undefined ? null : sale.card_fee_bps / 100,
  cardFee: sale.card_fee_cents === null || sale.card_fee_cents === undefined ? null : fromCents(sale.card_fee_cents),
  cardGrossTotal: sale.card_gross_cents === null || sale.card_gross_cents === undefined ? null : fromCents(sale.card_gross_cents),
  cardInstallmentAmount: sale.card_installment_cents === null || sale.card_installment_cents === undefined ? null : fromCents(sale.card_installment_cents),
  cardFeePassed: sale.card_fee_passed === null || sale.card_fee_passed === undefined ? null : Boolean(sale.card_fee_passed),
  notes: sale.notes, soldAt: sale.sold_at,
  items: (sale.items || []).map((item: any) => ({ id: item.id, itemType: item.item_type, productId: item.product_id, serviceCode: item.service_code, description: item.description, quantity: item.quantity, unitPrice: fromCents(item.unit_price_cents), unitCost: fromCents(item.unit_cost_cents), total: fromCents(item.total_cents) })),
});

export class SaleService {
  constructor(
    private readonly database: DatabaseManager,
    private readonly sales: SaleRepository,
    private readonly products: ProductRepository,
    private readonly catalog: ServiceRepository,
    private readonly cash: CashRepository,
  ) {}

  create(input: SaleInput) {
    const createSale = this.database.db.transaction(() => {
      const quantities = new Map<number, number>();
      for (const item of input.items) if (item.itemType === 'PRODUCT' && item.productId) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
      const inventory = new Map<number, any>();
      for (const [productId, quantity] of quantities) {
        const product = this.products.findById(productId);
        if (!product || !product.active) throw new AppError(404, 'Um dos produtos da venda não está mais disponível.');
        if (product.quantity < quantity) throw new AppError(409, `Estoque insuficiente: ${product.brand || product.name} ${product.model || ''}.`);
        inventory.set(productId, product);
      }

      const normalized = input.items.map((item) => {
        const priceCents = toCents(item.unitPrice);
        let costCents = 0;
        if (item.itemType === 'PRODUCT') costCents = inventory.get(item.productId!)!.purchase_price_cents;
        if (item.itemType === 'PART') costCents = toCents(item.unitCost!);
        if (item.itemType === 'SERVICE') {
          const service = this.catalog.find(item.serviceCode!);
          if (!service) throw new AppError(400, 'Serviço tabelado inválido.');
        }
        return { ...item, priceCents, costCents, totalCents: priceCents * item.quantity };
      });
      const subtotalCents = normalized.reduce((sum, item) => sum + item.totalCents, 0);
      const discountType = input.discountType || null;
      const discountValue = input.discountValue || 0;
      const discountCents = discountType === 'PERCENT'
        ? Math.round(subtotalCents * discountValue / 100)
        : discountType === 'FIXED' ? Math.min(subtotalCents, toCents(discountValue)) : 0;
      const desiredTotalCents = subtotalCents - discountCents;
      const cardPayment = input.paymentMethod === 'CARD' ? calculateCardPayment(desiredTotalCents, input.cardInstallments!, input.cardFeePassed !== false) : null;
      const totalCents = cardPayment?.netCents ?? desiredTotalCents;
      const totalCostCents = normalized.reduce((sum, item) => sum + item.costCents * item.quantity, 0);
      const id = this.sales.create({
        saleNumber: `TEMP-${randomUUID()}`, vehiclePlate: input.vehiclePlate?.toUpperCase() || null, vehicleModel: input.vehicleModel || null,
        subtotalCents, discountType, discountValue: discountType === 'PERCENT' ? Math.round(discountValue * 100) : toCents(discountValue),
        discountCents, totalCents, profitCents: totalCents - totalCostCents, paymentMethod: input.paymentMethod,
        cardInstallments: cardPayment?.installments ?? null, cardFeeBps: cardPayment?.feeBps ?? null, cardFeeCents: cardPayment?.feeCents ?? null,
        cardGrossCents: cardPayment?.grossCents ?? null, cardInstallmentCents: cardPayment?.installmentCents ?? null, cardFeePassed: cardPayment ? Number(cardPayment.feePassed) : null,
        notes: input.notes || null, soldAt: localDateTime(),
      });
      const saleNumber = `V${localDate().replaceAll('-', '')}-${String(id).padStart(5, '0')}`;
      this.sales.setNumber(id, saleNumber);
      for (const item of normalized) {
        this.sales.addItem({ saleId: id, itemType: item.itemType, productId: item.productId || null, serviceCode: item.serviceCode || null, description: item.description, quantity: item.quantity, unitPriceCents: item.priceCents, unitCostCents: item.costCents, totalCents: item.totalCents });
        if (item.itemType === 'PRODUCT' && item.productId) {
          const product = inventory.get(item.productId)!;
          product.quantity -= item.quantity;
          this.products.updateQuantity(item.productId, product.quantity);
          this.products.addMovement(item.productId, 'SALE', -item.quantity, product.quantity, `Venda ${saleNumber}`);
        }
      }
      this.cash.add({ saleId: id, entryType: 'IN', category: 'SALE', description: `Venda ${saleNumber}${cardPayment ? ` — Cartão ${cardPayment.installments}x${cardPayment.feePassed ? '' : ' (taxa absorvida)'}` : ''}`, amountCents: totalCents, occurredOn: localDate() });
      return this.sales.find(id);
    });
    return saleView(createSale());
  }

  list(filters: { plate?: string; startDate?: string; endDate?: string; term?: string; page?: string }) {
    const requestedPage = Math.max(1, Math.floor(Number(filters.page) || 1));
    const { sales, ...pagination } = this.sales.list({ ...filters, page: requestedPage, pageSize: 10 });
    return { ...pagination, items: sales.map(saleView) };
  }
  get(id: number) { const sale = saleView(this.sales.find(id)); if (!sale) throw new AppError(404, 'Venda não encontrada.'); return sale; }
  updateNotes(id: number, notes: string | null) { this.get(id); return saleView(this.sales.updateNotes(id, notes)); }
  remove(id: number) {
    const reverseSale = this.database.db.transaction(() => {
      const sale = this.sales.find(id);
      if (!sale) throw new AppError(404, 'Venda não encontrada.');
      for (const item of sale.items) {
        if (item.item_type !== 'PRODUCT' || !item.product_id) continue;
        const product = this.products.findById(item.product_id);
        if (!product) throw new AppError(409, `Não foi possível estornar o produto do item ${item.description}.`);
        const quantityAfter = product.quantity + item.quantity;
        this.products.updateQuantity(product.id, quantityAfter);
        this.products.addMovement(product.id, 'ADJUSTMENT', item.quantity, quantityAfter, `Estorno da venda ${sale.sale_number}`);
      }
      this.cash.removeBySale(id);
      this.sales.remove(id);
    });
    reverseSale();
  }
}

export { saleView };
