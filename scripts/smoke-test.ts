import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBackend } from '../backend/src/app';

async function main() {
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pneu-pro-smoke-'));
  const backend = createBackend({
    databasePath: path.join(temporaryDir, 'pneu-pro.db'),
    migrationsPath: path.join(process.cwd(), 'database', 'migrations'),
    backupDir: path.join(temporaryDir, 'backups'),
  });
  const server = backend.app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const request = async (route: string, options: RequestInit = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}/api${route}`, options);
    const payload = response.status === 204 ? undefined : await response.json();
    return { response, payload };
  };
  try {
  const settingsResult = await request('/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hideCostInInventory: true }) });
  assert.equal(settingsResult.response.status, 200);
  assert.equal((settingsResult.payload as { hideCostInInventory: boolean }).hideCostInInventory, true);
  const productResult = await request('/products', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'TIRE', brand: 'Teste', model: 'Seguro', tireWidth: '205', tireHeight: '55', rim: 'R16', tireCondition: 'NOVO', purchasePrice: 200, salePrice: 300, quantity: 5, minimumQuantity: 2 }),
  });
  assert.equal(productResult.response.status, 201);
  const product = productResult.payload as { id: number };
  const measureSearchResult = await request('/products?type=TIRE&search=205%2F55%20R16');
  assert.equal(measureSearchResult.response.status, 200);
  assert.equal((measureSearchResult.payload as Array<{ id: number }>)[0].id, product.id);
  const saleResult = await request('/sales', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod: 'PIX', discountType: 'FIXED', discountValue: 10, items: [{ itemType: 'PRODUCT', productId: product.id, description: 'Teste Seguro 205/55 R16', quantity: 2, unitPrice: 300 }, { itemType: 'LABOR', description: 'Serviço de teste', quantity: 1, unitPrice: 50 }] }),
  });
  assert.equal(saleResult.response.status, 201);
  const sale = saleResult.payload as { id: number; total: number; profit: number };
  assert.equal(sale.total, 640);
  assert.equal(sale.profit, 240);
  const stockResult = await request('/products');
  assert.equal((stockResult.payload as Array<{ quantity: number }>)[0].quantity, 3);
  const cashResult = await request('/cash');
  assert.equal((cashResult.payload as { totals: { balance: number } }).totals.balance, 640);
  const removeResult = await request(`/sales/${sale.id}`, { method: 'DELETE' });
  assert.equal(removeResult.response.status, 204);
  const stockAfterRemoval = await request('/products');
  assert.equal((stockAfterRemoval.payload as Array<{ quantity: number }>)[0].quantity, 5);
  const cashAfterRemoval = await request('/cash');
  assert.equal((cashAfterRemoval.payload as { totals: { balance: number } }).totals.balance, 0);
  console.log('Smoke test aprovado: venda, estorno, estoque, lucro e caixa estão integrados.');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    backend.database.close();
    const safeTemp = path.resolve(os.tmpdir());
    const safeTarget = path.resolve(temporaryDir);
    if (safeTarget.startsWith(safeTemp + path.sep)) fs.rmSync(safeTarget, { recursive: true, force: true });
  }
}

void main();
