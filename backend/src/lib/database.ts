import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { AppError } from './errors';

export class DatabaseManager {
  private connection!: Database.Database;
  constructor(private readonly databasePath: string, private readonly migrationsPath: string) {}

  get db() { return this.connection; }

  initialize() {
    fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
    this.connection = new Database(this.databasePath);
    this.connection.pragma('journal_mode = WAL');
    this.connection.pragma('foreign_keys = ON');
    this.connection.pragma('busy_timeout = 5000');
    this.runMigrations();
  }

  private runMigrations() {
    this.connection.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const applied = new Set(this.connection.prepare('SELECT name FROM schema_migrations').all().map((row: any) => row.name));
    for (const file of fs.readdirSync(this.migrationsPath).filter((item) => item.endsWith('.sql')).sort()) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(this.migrationsPath, file), 'utf8');
      const apply = this.connection.transaction(() => {
        this.connection.exec(sql);
        this.connection.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
      });
      apply();
    }
  }

  createBackup(destination: string) {
    this.connection.pragma('wal_checkpoint(TRUNCATE)');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(this.databasePath, destination);
  }

  replaceFrom(source: string, automaticBackupPath: string) {
    if (!fs.existsSync(source)) throw new AppError(400, 'Arquivo de backup não encontrado.');
    const probe = new Database(source, { readonly: true });
    try {
      const table = probe.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
      if (!table) throw new AppError(400, 'O arquivo selecionado não é um backup válido do Pneu Pro Gestão.');
    } finally { probe.close(); }
    this.createBackup(automaticBackupPath);
    this.connection.close();
    fs.copyFileSync(source, this.databasePath);
    for (const suffix of ['-wal', '-shm']) {
      const stale = `${this.databasePath}${suffix}`;
      if (fs.existsSync(stale)) fs.rmSync(stale);
    }
    this.initialize();
  }

  close() { this.connection?.close(); }
}
