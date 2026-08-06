import { DatabaseManager } from '../lib/database';

export class SaleRepository {
  constructor(private readonly database: DatabaseManager) {}

  create(data: Record<string, unknown>) {
    const result = this.database.db.prepare(`INSERT INTO sales (
      sale_number, vehicle_plate, vehicle_model, subtotal_cents, discount_type, discount_value, discount_cents,
      total_cents, profit_cents, payment_method, notes, sold_at
    ) VALUES (@saleNumber, @vehiclePlate, @vehicleModel, @subtotalCents, @discountType, @discountValue, @discountCents,
      @totalCents, @profitCents, @paymentMethod, @notes, @soldAt)`).run(data);
    return Number(result.lastInsertRowid);
  }

  setNumber(id: number, saleNumber: string) { this.database.db.prepare('UPDATE sales SET sale_number=? WHERE id=?').run(saleNumber, id); }

  addItem(data: Record<string, unknown>) {
    this.database.db.prepare(`INSERT INTO sale_items (sale_id,item_type,product_id,service_code,description,quantity,unit_price_cents,unit_cost_cents,total_cents)
      VALUES (@saleId,@itemType,@productId,@serviceCode,@description,@quantity,@unitPriceCents,@unitCostCents,@totalCents)`).run(data);
  }

  list(params: { plate?: string; startDate?: string; endDate?: string; term?: string }) {
    const where: string[] = [];
    const values: unknown[] = [];
    if (params.plate) { where.push('UPPER(s.vehicle_plate) LIKE ?'); values.push(`%${params.plate.toUpperCase()}%`); }
    if (params.startDate) { where.push('date(s.sold_at) >= date(?)'); values.push(params.startDate); }
    if (params.endDate) { where.push('date(s.sold_at) <= date(?)'); values.push(params.endDate); }
    if (params.term) {
      where.push(`(s.vehicle_model LIKE ? OR s.vehicle_plate LIKE ? OR EXISTS (SELECT 1 FROM sale_items sx WHERE sx.sale_id=s.id AND sx.description LIKE ?))`);
      values.push(`%${params.term}%`, `%${params.term}%`, `%${params.term}%`);
    }
    const sql = `SELECT s.* FROM sales s ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY s.sold_at DESC LIMIT 500`;
    const sales = this.database.db.prepare(sql).all(...values) as any[];
    return sales.map((sale) => ({ ...sale, items: this.items(sale.id) }));
  }

  items(saleId: number) { return this.database.db.prepare('SELECT * FROM sale_items WHERE sale_id=? ORDER BY id').all(saleId); }

  find(id: number) {
    const sale = this.database.db.prepare('SELECT * FROM sales WHERE id=?').get(id) as any;
    return sale ? { ...sale, items: this.items(id) } : null;
  }

  updateNotes(id: number, notes: string | null) { this.database.db.prepare('UPDATE sales SET notes=? WHERE id=?').run(notes, id); return this.find(id); }
  remove(id: number) { this.database.db.prepare('DELETE FROM sales WHERE id=?').run(id); }
}
