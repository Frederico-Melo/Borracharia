import { DatabaseManager } from '../lib/database';
import { fromCents } from '../lib/money';
import { monthRange } from '../lib/date';
import { productView } from './product.service';

export class DashboardService {
  constructor(private readonly database: DatabaseManager) {}
  get() {
    const db = this.database.db;
    const month = monthRange();
    const today = db.prepare(`SELECT COALESCE(SUM(total_cents),0) AS sales, COUNT(*) AS count FROM sales WHERE date(sold_at,'localtime')=date('now','localtime')`).get() as any;
    const currentMonth = db.prepare(`SELECT COALESCE(SUM(total_cents),0) AS sales, COALESCE(SUM(profit_cents),0) AS profit FROM sales WHERE date(sold_at,'localtime') >= date(?) AND date(sold_at,'localtime') < date(?)`).get(month.start, month.end) as any;
    const stockByType = db.prepare(`SELECT type, COALESCE(SUM(quantity * sale_price_cents),0) AS sale_value_cents, COALESCE(SUM(quantity * purchase_price_cents),0) AS cost_value_cents FROM products WHERE active=1 GROUP BY type`).all() as Array<{ type: 'TIRE' | 'WHEEL' | 'VALVE'; sale_value_cents: number; cost_value_cents: number }>;
    const stockValueCents = { total: 0, tires: 0, wheels: 0, valves: 0 };
    const stockCostCents = { total: 0, tires: 0, wheels: 0, valves: 0 };
    for (const row of stockByType) {
      if (row.type === 'TIRE') { stockValueCents.tires = row.sale_value_cents; stockCostCents.tires = row.cost_value_cents; }
      if (row.type === 'WHEEL') { stockValueCents.wheels = row.sale_value_cents; stockCostCents.wheels = row.cost_value_cents; }
      if (row.type === 'VALVE') { stockValueCents.valves = row.sale_value_cents; stockCostCents.valves = row.cost_value_cents; }
      stockValueCents.total += row.sale_value_cents;
      stockCostCents.total += row.cost_value_cents;
    }
    const stockValue = { total: fromCents(stockValueCents.total), tires: fromCents(stockValueCents.tires), wheels: fromCents(stockValueCents.wheels), valves: fromCents(stockValueCents.valves) };
    const stockCost = { total: fromCents(stockCostCents.total), tires: fromCents(stockCostCents.tires), wheels: fromCents(stockCostCents.wheels), valves: fromCents(stockCostCents.valves) };
    const lowStock = db.prepare('SELECT * FROM products WHERE active=1 AND quantity <= minimum_quantity ORDER BY quantity, brand, model LIMIT 12').all().map(productView);
    const recentSales = db.prepare('SELECT id,sale_number,vehicle_plate,vehicle_model,total_cents,payment_method,sold_at FROM sales ORDER BY sold_at DESC LIMIT 8').all().map((sale: any) => ({
      id: sale.id, saleNumber: sale.sale_number, vehiclePlate: sale.vehicle_plate, vehicleModel: sale.vehicle_model, total: fromCents(sale.total_cents), paymentMethod: sale.payment_method, soldAt: sale.sold_at,
    }));
    return { todaySales: fromCents(today.sales), todayCount: today.count, monthSales: fromCents(currentMonth.sales), monthProfit: fromCents(currentMonth.profit), stockValue, stockCost, lowStock, recentSales };
  }
}
