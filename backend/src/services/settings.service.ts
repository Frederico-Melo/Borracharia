import { SettingsRepository } from '../repositories/settings.repository';

export type AppSettings = { companyName: string; defaultMinimumStock: number; automaticBackup: boolean; hideCostInInventory: boolean };
const defaults: AppSettings = { companyName: 'Pneu Pro Gestão', defaultMinimumStock: 2, automaticBackup: true, hideCostInInventory: false };

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}
  get(): AppSettings {
    const collected = { ...defaults };
    for (const row of this.settings.all()) {
      if (row.key in defaults) (collected as any)[row.key] = JSON.parse(row.value);
    }
    return collected;
  }
  update(input: Partial<AppSettings>) {
    const next = { ...this.get(), ...input };
    if (!next.companyName.trim() || next.companyName.length > 80) throw new Error('Informe um nome de empresa válido.');
    if (!Number.isInteger(next.defaultMinimumStock) || next.defaultMinimumStock < 0) throw new Error('Estoque mínimo padrão inválido.');
    for (const [key, value] of Object.entries(next)) this.settings.set(key, value);
    return next;
  }
}
