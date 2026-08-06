import path from 'node:path';
import { createBackend } from '../../backend/src/app';

const root = process.cwd();
const backend = createBackend({ databasePath: path.join(root, 'data', 'pneu-pro.db'), migrationsPath: path.join(root, 'database', 'migrations') });
const db = backend.database.db;

if ((db.prepare('SELECT COUNT(*) AS total FROM products').get() as { total: number }).total === 0) {
  const add = db.prepare(`INSERT INTO products (type,brand,model,name,tire_width,tire_height,rim,tire_condition,bolt_pattern,wheel_width,valve_type,purchase_price_cents,sale_price_cents,quantity,minimum_quantity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const movement = db.prepare('INSERT INTO stock_movements (product_id,movement_type,quantity_change,quantity_after,reason) VALUES (?,?,?,?,?)');
  db.transaction(() => {
    const rows = [
      ['TIRE', 'Michelin', 'Primacy 4', null, '205', '55', 'R16', 'NOVO', null, null, null, 42000, 69000, 8, 2],
      ['TIRE', 'Goodyear', 'EfficientGrip', null, '175', '65', 'R14', 'NOVO', null, null, null, 28000, 44000, 4, 2],
      ['WHEEL', 'KR', 'K51', null, null, null, 'R17', null, '5x114.3', '7', null, 65000, 95000, 2, 1],
      ['VALVE', null, null, 'Bico de borracha TR413', null, null, null, null, null, null, 'Borracha', 450, 1200, 30, 10],
    ];
    rows.forEach((row) => { const result = add.run(...row); movement.run(result.lastInsertRowid, 'INITIAL', row[13], row[13], 'Dados de exemplo'); });
  })();
  console.log('Dados de exemplo inseridos.');
} else console.log('Seed ignorado: já existem produtos cadastrados.');
backend.database.close();
