import { DatabaseManager } from '../lib/database';

export class SettingsRepository {
  constructor(private readonly database: DatabaseManager) {}
  all() { return this.database.db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>; }
  set(key: string, value: unknown) {
    this.database.db.prepare(`INSERT INTO settings(key,value,updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`).run(key, JSON.stringify(value));
  }
}
