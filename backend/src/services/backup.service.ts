import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseManager } from '../lib/database';
import { AppError } from '../lib/errors';
import { SettingsService } from './settings.service';

export class BackupService {
  constructor(private readonly database: DatabaseManager, private readonly settings: SettingsService, private readonly backupDir: string) {}
  exportTemporary() {
    const file = path.join(this.backupDir, `exportacao-${Date.now()}.db`);
    this.database.createBackup(file);
    return file;
  }
  importBase64(content: string) {
    if (!content || content.length > 200_000_000) throw new AppError(400, 'Arquivo de backup inválido ou muito grande.');
    const file = path.join(this.backupDir, `importacao-${randomUUID()}.db`);
    fs.mkdirSync(this.backupDir, { recursive: true });
    fs.writeFileSync(file, Buffer.from(content, 'base64'));
    try {
      this.database.replaceFrom(file, path.join(this.backupDir, `antes-da-restauracao-${Date.now()}.db`));
    } finally { if (fs.existsSync(file)) fs.rmSync(file); }
  }
  autoBackupIfNeeded() {
    if (!this.settings.get().automaticBackup) return;
    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(this.backupDir, `automatico-${day}.db`);
    if (!fs.existsSync(file)) this.database.createBackup(file);
  }
}
