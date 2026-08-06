import { DatabaseManager } from '../lib/database';

export class CashRepository {
  constructor(private readonly database: DatabaseManager) {}
  add(data: Record<string, unknown>) {
    return this.database.db.prepare(`INSERT INTO cash_entries (sale_id,entry_type,category,description,amount_cents,occurred_on)
      VALUES (@saleId,@entryType,@category,@description,@amountCents,@occurredOn)`).run(data);
  }
  removeBySale(saleId: number) { this.database.db.prepare('DELETE FROM cash_entries WHERE sale_id = ?').run(saleId); }
  list(start?: string, end?: string) {
    const clauses: string[] = []; const values: unknown[] = [];
    if (start) { clauses.push('date(occurred_on) >= date(?)'); values.push(start); }
    if (end) { clauses.push('date(occurred_on) <= date(?)'); values.push(end); }
    return this.database.db.prepare(`SELECT * FROM cash_entries ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY occurred_on DESC, id DESC LIMIT 500`).all(...values);
  }
}
