import { AppError } from '../lib/errors';
import { fromCents, toCents } from '../lib/money';
import { ServiceRepository } from '../repositories/service.repository';

const catalogView = (row: any) => ({ code: row.code, name: row.name, price: fromCents(row.price_cents), updatedAt: row.updated_at });

export class CatalogService {
  constructor(private readonly catalog: ServiceRepository) {}
  list() { return this.catalog.list().map(catalogView); }
  save(code: 'ALIGNMENT' | 'BALANCING', price: number) {
    if (!Number.isFinite(price) || price < 0) throw new AppError(400, 'Informe um preço válido.');
    const name = code === 'ALIGNMENT' ? 'Alinhamento' : 'Balanceamento';
    return catalogView(this.catalog.save(code, name, toCents(price)));
  }
}
