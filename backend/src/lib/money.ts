export const toCents = (value: unknown): number => {
  const numeric = typeof value === 'string'
    ? Number(value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value)
    : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error('Valor monetário inválido.');
  return Math.round(numeric * 100);
};

export const fromCents = (value: number | null | undefined) => Number(((value ?? 0) / 100).toFixed(2));
export const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
