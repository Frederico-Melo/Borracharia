import { DatabaseManager } from '../lib/database';
import { fromCents } from '../lib/money';
import { monthRange } from '../lib/date';

const moneyRow = (row: any, fields: string[]) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, fields.includes(key) ? fromCents(value as number) : value]));

export class ReportService {
  constructor(private readonly database: DatabaseManager) {}
  get(input: { start?: string; end?: string }) {
    const range = monthRange(); const start = input.start || range.start;
    const end = input.end ? new Date(`${input.end}T12:00:00`).getTime() : null;
    const endExclusive = end ? new Date(end + 86_400_000).toISOString().slice(0, 10) : range.end;
    const db = this.database.db;
    const params = [start, endExclusive];
    const overview = db.prepare(`SELECT COALESCE(SUM(total_cents),0) AS revenue, COALESCE(SUM(profit_cents),0) AS profit, COUNT(*) AS salesCount FROM sales WHERE date(sold_at,'localtime') >= date(?) AND date(sold_at,'localtime') < date(?)`).get(...params) as any;
    const daily = db.prepare(`SELECT date(sold_at,'localtime') AS date, COALESCE(SUM(total_cents),0) AS revenue, COALESCE(SUM(profit_cents),0) AS profit, COUNT(*) AS salesCount FROM sales WHERE date(sold_at,'localtime') >= date(?) AND date(sold_at,'localtime') < date(?) GROUP BY date(sold_at,'localtime') ORDER BY date`).all(...params).map((row: any) => moneyRow(row, ['revenue', 'profit']));
    const products = db.prepare(`SELECT si.description, SUM(si.quantity) AS quantity, SUM(si.total_cents) AS revenue FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE si.item_type='PRODUCT' AND date(s.sold_at,'localtime') >= date(?) AND date(s.sold_at,'localtime') < date(?) GROUP BY si.product_id,si.description ORDER BY quantity DESC,revenue DESC LIMIT 20`).all(...params).map((row: any) => moneyRow(row, ['revenue']));
    const services = db.prepare(`SELECT si.description, SUM(si.quantity) AS quantity, SUM(si.total_cents) AS revenue FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE si.item_type IN ('SERVICE','LABOR') AND date(s.sold_at,'localtime') >= date(?) AND date(s.sold_at,'localtime') < date(?) GROUP BY si.description ORDER BY quantity DESC,revenue DESC LIMIT 20`).all(...params).map((row: any) => moneyRow(row, ['revenue']));
    const parts = db.prepare(`SELECT si.description, SUM(si.quantity) AS quantity, SUM(si.total_cents) AS revenue FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE si.item_type='PART' AND date(s.sold_at,'localtime') >= date(?) AND date(s.sold_at,'localtime') < date(?) GROUP BY si.description ORDER BY quantity DESC,revenue DESC LIMIT 20`).all(...params).map((row: any) => moneyRow(row, ['revenue']));
    return { range: { start, end: input.end || new Date().toISOString().slice(0, 10) }, overview: moneyRow(overview, ['revenue', 'profit']), daily, products, services, parts };
  }
}
