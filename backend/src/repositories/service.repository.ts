import { DatabaseManager } from '../lib/database';

export class ServiceRepository {
  constructor(private readonly database: DatabaseManager) {}
  list() { return this.database.db.prepare('SELECT * FROM service_catalog WHERE active=1 ORDER BY id').all(); }
  find(code: string) { return this.database.db.prepare('SELECT * FROM service_catalog WHERE code=? AND active=1').get(code) as any; }
  save(code: 'ALIGNMENT' | 'BALANCING', name: string, priceCents: number) {
    this.database.db.prepare(`INSERT INTO service_catalog (code, name, price_cents) VALUES (?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET name=excluded.name, price_cents=excluded.price_cents, updated_at=CURRENT_TIMESTAMP`).run(code, name, priceCents);
    return this.find(code);
  }
}
