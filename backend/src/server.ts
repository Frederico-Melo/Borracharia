import path from 'node:path';
import { createBackend } from './app';

const root = process.cwd();
const port = Number(process.env.PORT || 3333);
const backend = createBackend({
  databasePath: process.env.DATABASE_PATH || path.join(root, 'data', 'pneu-pro.db'),
  migrationsPath: process.env.MIGRATIONS_PATH || path.join(root, 'database', 'migrations'),
});
backend.backups.autoBackupIfNeeded();
backend.app.listen(port, '127.0.0.1', () => console.log(`API local em http://127.0.0.1:${port}`));
