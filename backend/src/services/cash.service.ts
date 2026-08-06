import { CashRepository } from '../repositories/cash.repository';
import { AppError } from '../lib/errors';
import { fromCents, toCents } from '../lib/money';
import { localDate } from '../lib/date';

const entryView = (entry: any) => ({ id: entry.id, saleId: entry.sale_id, entryType: entry.entry_type, category: entry.category, description: entry.description, amount: fromCents(entry.amount_cents), occurredOn: entry.occurred_on, createdAt: entry.created_at });

export class CashService {
  constructor(private readonly cash: CashRepository) {}
  list(filters: { start?: string; end?: string }) {
    const entries = this.cash.list(filters.start, filters.end).map(entryView);
    const input = entries.filter((entry) => entry.entryType === 'IN').reduce((sum, entry) => sum + entry.amount, 0);
    const output = entries.filter((entry) => entry.entryType === 'OUT').reduce((sum, entry) => sum + entry.amount, 0);
    return { entries, totals: { input, output, balance: input - output } };
  }
  create(input: { entryType: 'IN' | 'OUT'; category: 'EXPENSE' | 'PURCHASE' | 'OTHER'; description: string; amount: number; occurredOn?: string }) {
    this.cash.add({ saleId: null, entryType: input.entryType, category: input.category, description: input.description, amountCents: toCents(input.amount), occurredOn: input.occurredOn || localDate() });
  }
  remove(id: number) {
    const entry = this.cash.findById(id);
    if (!entry) throw new AppError(404, 'Lançamento não encontrado.');
    if (entry.sale_id !== null) throw new AppError(409, 'Lançamentos gerados por vendas só podem ser removidos ao excluir a venda no Histórico.');
    this.cash.remove(id);
  }
}
