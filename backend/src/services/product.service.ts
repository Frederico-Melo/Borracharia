import { ProductInput } from '../dtos/product.dto';
import { AppError } from '../lib/errors';
import { fromCents, toCents } from '../lib/money';
import { ProductRepository } from '../repositories/product.repository';

const productView = (row: any) => row && ({
  id: row.id, type: row.type, brand: row.brand, model: row.model, name: row.name,
  tireWidth: row.tire_width, tireHeight: row.tire_height, rim: row.rim, tireCondition: row.tire_condition,
  boltPattern: row.bolt_pattern, wheelWidth: row.wheel_width, valveType: row.valve_type,
  stockLocation: row.stock_location,
  purchasePrice: fromCents(row.purchase_price_cents), salePrice: fromCents(row.sale_price_cents),
  quantity: row.quantity, minimumQuantity: row.minimum_quantity, lowStock: row.quantity <= row.minimum_quantity,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export class ProductService {
  constructor(private readonly products: ProductRepository) {}
  list(query: { type?: string; search?: string; lowStock?: string }) { return this.products.list({ ...query, lowStock: query.lowStock === 'true' }).map(productView); }
  get(id: number) { const product = productView(this.products.findById(id)); if (!product) throw new AppError(404, 'Produto não encontrado.'); return product; }
  create(input: ProductInput) {
    this.validateRequiredFields(input);
    const product = this.products.create(this.toDatabaseInput(input));
    if (input.quantity > 0) this.products.addMovement(product.id, 'INITIAL', input.quantity, input.quantity, 'Estoque inicial');
    return productView(product);
  }
  update(id: number, input: ProductInput) {
    this.get(id); this.validateRequiredFields(input);
    return productView(this.products.update(id, this.toDatabaseInput(input)));
  }
  move(id: number, input: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string }) {
    const product = this.get(id);
    let after = product.quantity; let change = input.quantity;
    if (input.type === 'IN') after += input.quantity;
    if (input.type === 'OUT') { after -= input.quantity; change = -input.quantity; }
    if (input.type === 'ADJUSTMENT') { after = input.quantity; change = input.quantity - product.quantity; }
    if (after < 0) throw new AppError(409, 'Estoque insuficiente para realizar esta saída.');
    this.products.updateQuantity(id, after); this.products.addMovement(id, input.type, change, after, input.reason);
    return this.get(id);
  }
  movements(id: number) { this.get(id); return this.products.movements(id); }
  remove(id: number) { this.get(id); this.products.remove(id); }
  private validateRequiredFields(input: ProductInput) {
    if (input.type === 'TIRE' && (!input.brand || !input.model || !input.tireWidth || !input.tireHeight || !input.rim || !input.tireCondition)) throw new AppError(400, 'Informe marca, modelo, medidas, aro e tipo do pneu.');
    if (input.type === 'WHEEL' && (!input.rim || !input.boltPattern || !input.wheelWidth)) throw new AppError(400, 'Informe furação, aro e tala da roda.');
    if (input.type === 'VALVE' && !input.name) throw new AppError(400, 'Informe o nome do bico.');
  }
  private toDatabaseInput(input: ProductInput) {
    return {
      type: input.type, brand: input.brand ?? null, model: input.model ?? null, name: input.name ?? null,
      tireWidth: input.tireWidth ?? null, tireHeight: input.tireHeight ?? null, rim: input.rim ?? null,
      tireCondition: input.tireCondition ?? null, boltPattern: input.boltPattern ?? null, wheelWidth: input.wheelWidth ?? null, valveType: input.valveType ?? null, stockLocation: input.stockLocation ?? 'STOCK',
      purchasePriceCents: toCents(input.purchasePrice), salePriceCents: toCents(input.salePrice), quantity: input.quantity, minimumQuantity: input.minimumQuantity,
    };
  }
}

export { productView };
