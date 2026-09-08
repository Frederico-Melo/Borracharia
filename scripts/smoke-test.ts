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
  const removableProductResult = await request('/products', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'VALVE', name: 'Bico de teste removível', purchasePrice: 5, salePrice: 10, quantity: 3, minimumQuantity: 1 }),
  });
  assert.equal(removableProductResult.response.status, 201);
  const removableProduct = removableProductResult.payload as { id: number };
  const removeUnsoldProductResult = await request(`/products/${removableProduct.id}`, { method: 'DELETE' });
  assert.equal(removeUnsoldProductResult.response.status, 204);
  const productsAfterUnsoldRemoval = await request('/products');
  assert.equal((productsAfterUnsoldRemoval.payload as Array<{ id: number }>).some((item) => item.id === removableProduct.id), false);
  const dashboardBeforeSale = await request('/dashboard');
  assert.equal((dashboardBeforeSale.payload as { stockValue: { total: number; tires: number; wheels: number; valves: number } }).stockValue.total, 1500);
  assert.equal((dashboardBeforeSale.payload as { stockValue: { tires: number } }).stockValue.tires, 1500);
  assert.equal((dashboardBeforeSale.payload as { stockValue: { wheels: number; valves: number } }).stockValue.wheels, 0);
  assert.equal((dashboardBeforeSale.payload as { stockValue: { wheels: number; valves: number } }).stockValue.valves, 0);
  assert.equal((dashboardBeforeSale.payload as { stockCost: { total: number; tires: number } }).stockCost.total, 1000);
  assert.equal((dashboardBeforeSale.payload as { stockCost: { tires: number } }).stockCost.tires, 1000);
  const measureSearchResult = await request('/products?type=TIRE&search=205%2F55%20R16');
  assert.equal(measureSearchResult.response.status, 200);
  assert.equal((measureSearchResult.payload as Array<{ id: number }>)[0].id, product.id);
  const saleResult = await request('/sales', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod: 'PIX', discountType: 'FIXED', discountValue: 10, items: [{ itemType: 'PRODUCT', productId: product.id, description: 'Teste Seguro 205/55 R16', quantity: 2, unitPrice: 300 }, { itemType: 'LABOR', description: 'Serviço de teste', quantity: 1, unitPrice: 50 }, { itemType: 'PART', description: 'Pastilha de teste', quantity: 1, unitPrice: 50, unitCost: 30 }] }),
  });
  assert.equal(saleResult.response.status, 201);
  const sale = saleResult.payload as { id: number; total: number; profit: number };
  assert.equal(sale.total, 690);
  assert.equal(sale.profit, 260);
  const savedSale = await request(`/sales/${sale.id}`);
  assert.equal((savedSale.payload as { items: Array<{ itemType: string; unitCost: number }> }).items.find((item) => item.itemType === 'PART')?.unitCost, 30);
  const reportWithPart = await request('/reports');
  assert.equal((reportWithPart.payload as { parts: Array<{ description: string; quantity: number; revenue: number }> }).parts[0].description, 'Pastilha de teste');
  assert.equal((reportWithPart.payload as { parts: Array<{ description: string; quantity: number; revenue: number }> }).parts[0].revenue, 50);
  const extraSales: Array<{ id: number }> = [];
  for (let index = 0; index < 10; index += 1) {
    const extraSaleResult = await request('/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: 'CASH', items: [{ itemType: 'LABOR', description: `Serviço paginado ${index + 1}`, quantity: 1, unitPrice: 10 }] }),
    });
    assert.equal(extraSaleResult.response.status, 201);
    extraSales.push(extraSaleResult.payload as { id: number });
  }
  const pagedHistory = await request('/sales?page=1');
  assert.equal(pagedHistory.response.status, 200);
  assert.equal((pagedHistory.payload as { pageSize: number }).pageSize, 10);
  assert.equal((pagedHistory.payload as { total: number }).total, 11);
  assert.equal((pagedHistory.payload as { items: Array<{ id: number }> }).items.length, 10);
  const secondHistoryPage = await request('/sales?page=2');
  assert.equal((secondHistoryPage.payload as { page: number }).page, 2);
  assert.equal((secondHistoryPage.payload as { items: Array<{ id: number }> }).items.length, 1);
  for (const extraSale of extraSales) {
    const removeExtraSaleResult = await request(`/sales/${extraSale.id}`, { method: 'DELETE' });
    assert.equal(removeExtraSaleResult.response.status, 204);
  }
  const stockResult = await request('/products');
  assert.equal((stockResult.payload as Array<{ quantity: number }>)[0].quantity, 3);
  const cashResult = await request('/cash');
  assert.equal((cashResult.payload as { totals: { balance: number } }).totals.balance, 690);
  const removeResult = await request(`/sales/${sale.id}`, { method: 'DELETE' });
  assert.equal(removeResult.response.status, 204);
  const stockAfterRemoval = await request('/products');
  assert.equal((stockAfterRemoval.payload as Array<{ quantity: number }>)[0].quantity, 5);
  const cashAfterRemoval = await request('/cash');
  assert.equal((cashAfterRemoval.payload as { totals: { balance: number } }).totals.balance, 0);
  const cardSaleResult = await request('/sales', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod: 'CARD', cardInstallments: 2, items: [{ itemType: 'LABOR', description: 'Serviço no cartão', quantity: 1, unitPrice: 100 }] }),
  });
  assert.equal(cardSaleResult.response.status, 201);
  const cardSale = cardSaleResult.payload as { id: number; total: number; profit: number; cardInstallments: number; cardFeeRate: number; cardFee: number; cardGrossTotal: number; cardInstallmentAmount: number };
  assert.deepEqual({ total: cardSale.total, profit: cardSale.profit, installments: cardSale.cardInstallments, rate: cardSale.cardFeeRate, fee: cardSale.cardFee, gross: cardSale.cardGrossTotal, installment: cardSale.cardInstallmentAmount }, { total: 100, profit: 100, installments: 2, rate: 3.99, fee: 4.16, gross: 104.16, installment: 52.08 });
  const cardHistory = await request(`/sales/${cardSale.id}`);
  assert.equal((cardHistory.payload as { cardInstallments: number; cardGrossTotal: number }).cardInstallments, 2);
  assert.equal((cardHistory.payload as { cardInstallments: number; cardGrossTotal: number }).cardGrossTotal, 104.16);
  const cashWithCard = await request('/cash');
  assert.equal((cashWithCard.payload as { totals: { balance: number } }).totals.balance, 100);
  assert.ok((cashWithCard.payload as { entries: Array<{ description: string }> }).entries.some((entry) => entry.description.includes('Cartão 2x')));
  const removeCardSaleResult = await request(`/sales/${cardSale.id}`, { method: 'DELETE' });
  assert.equal(removeCardSaleResult.response.status, 204);
  const cashAfterCardRemoval = await request('/cash');
  assert.equal((cashAfterCardRemoval.payload as { totals: { balance: number } }).totals.balance, 0);
  const manualEntryResult = await request('/cash', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entryType: 'OUT', category: 'EXPENSE', description: 'Despesa lançada por engano', amount: 45, occurredOn: '2026-08-06' }),
  });
  assert.equal(manualEntryResult.response.status, 201);
  const cashWithManualEntry = await request('/cash');
  const manualEntry = (cashWithManualEntry.payload as { entries: Array<{ id: number; description: string }>; totals: { balance: number } }).entries.find((entry) => entry.description === 'Despesa lançada por engano');
  assert.ok(manualEntry);
  assert.equal((cashWithManualEntry.payload as { totals: { balance: number } }).totals.balance, -45);
  const removeManualEntryResult = await request(`/cash/${manualEntry.id}`, { method: 'DELETE' });
  assert.equal(removeManualEntryResult.response.status, 204);
  const cashAfterManualRemoval = await request('/cash');
  assert.equal((cashAfterManualRemoval.payload as { totals: { balance: number } }).totals.balance, 0);
  console.log('Smoke test aprovado: venda, cartão parcelado, estorno, estoque, lucro e caixa estão integrados.');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    backend.database.close();
    const safeTemp = path.resolve(os.tmpdir());
    const safeTarget = path.resolve(temporaryDir);
    if (safeTarget.startsWith(safeTemp + path.sep)) fs.rmSync(safeTarget, { recursive: true, force: true });
  }
}

void main();
