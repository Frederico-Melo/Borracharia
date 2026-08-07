import { DatabaseManager } from '../lib/database';

export class ProductRepository {
  constructor(private readonly database: DatabaseManager) {}

  list(params: { type?: string; search?: string; lowStock?: boolean }) {
    const where = ['active = 1'];
    const values: unknown[] = [];
    if (params.type && ['TIRE', 'WHEEL', 'VALVE'].includes(params.type)) { where.push('type = ?'); values.push(params.type); }
    if (params.search) {
      const searchableFields = "UPPER(COALESCE(brand,'') || ' ' || COALESCE(model,'') || ' ' || COALESCE(name,'') || ' ' || COALESCE(tire_width,'') || ' ' || COALESCE(tire_height,'') || ' ' || COALESCE(rim,'') || ' ' || COALESCE(bolt_pattern,'') || ' ' || COALESCE(wheel_width,'') || ' ' || COALESCE(valve_type,''))";
      const terms = params.search.toUpperCase().match(/[A-ZÀ-Ÿ]+\d+|[A-ZÀ-Ÿ]+|\d+/g) || [];
      if (terms.length) {
        where.push(`(${terms.map(() => `${searchableFields} LIKE ?`).join(' AND ')})`);
        values.push(...terms.map((term) => `%${term}%`));
      }
    }
    if (params.lowStock) where.push('quantity <= minimum_quantity');
    return this.database.db.prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY quantity <= minimum_quantity DESC, type, brand, model, name`).all(...values);
  }

  findById(id: number) { return this.database.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any; }

  create(data: Record<string, unknown>) {
    const result = this.database.db.prepare(`INSERT INTO products (
      type, brand, model, name, tire_width, tire_height, rim, tire_condition, bolt_pattern, wheel_width, valve_type, stock_location,
      purchase_price_cents, sale_price_cents, quantity, minimum_quantity
    ) VALUES (@type, @brand, @model, @name, @tireWidth, @tireHeight, @rim, @tireCondition, @boltPattern, @wheelWidth, @valveType, @stockLocation,
      @purchasePriceCents, @salePriceCents, @quantity, @minimumQuantity)`).run(data);
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id: number, data: Record<string, unknown>) {
    this.database.db.prepare(`UPDATE products SET
      brand=@brand, model=@model, name=@name, tire_width=@tireWidth, tire_height=@tireHeight, rim=@rim,
      tire_condition=@tireCondition, bolt_pattern=@boltPattern, wheel_width=@wheelWidth, valve_type=@valveType, stock_location=@stockLocation,
      purchase_price_cents=@purchasePriceCents, sale_price_cents=@salePriceCents, minimum_quantity=@minimumQuantity,
      updated_at=CURRENT_TIMESTAMP WHERE id=@id AND active=1`).run({ ...data, id });
    return this.findById(id);
  }

  updateQuantity(id: number, quantity: number) {
    this.database.db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, id);
  }

  addMovement(productId: number, type: string, change: number, after: number, reason?: string) {
    this.database.db.prepare('INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_after, reason) VALUES (?, ?, ?, ?, ?)')
      .run(productId, type, change, after, reason || null);
  }

  movements(productId: number) {
    return this.database.db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 100').all(productId);
  }

  remove(id: number) {
    const inSales = this.database.db.prepare('SELECT 1 FROM sale_items WHERE product_id = ? LIMIT 1').get(id);
    if (inSales) this.database.db.prepare('UPDATE products SET active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    else this.database.db.transaction(() => {
      this.database.db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(id);
      this.database.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    })();
  }
}
