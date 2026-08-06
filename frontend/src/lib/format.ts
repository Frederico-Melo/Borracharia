export const money = (value = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
export const shortDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
export const dateInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
export const productName = (product: { type: string; brand?: string | null; model?: string | null; name?: string | null; tireWidth?: string | null; tireHeight?: string | null; rim?: string | null; boltPattern?: string | null; wheelWidth?: string | null; valveType?: string | null }) => {
  if (product.type === 'TIRE') return [product.brand, product.model, product.tireWidth && `${product.tireWidth}/${product.tireHeight}`, product.rim].filter(Boolean).join(' ');
  if (product.type === 'WHEEL') return [product.brand, product.model, product.rim, product.boltPattern && `Furação ${product.boltPattern}`, product.wheelWidth && `Tala ${product.wheelWidth}`].filter(Boolean).join(' ');
  return [product.name, product.valveType].filter(Boolean).join(' — ');
};
export const paymentLabel: Record<string, string> = { CASH: 'Dinheiro', PIX: 'PIX', CARD: 'Cartão', OTHER: 'Outro' };
export const categoryLabel: Record<string, string> = { SALE: 'Venda', EXPENSE: 'Despesa', PURCHASE: 'Compra', OTHER: 'Outro' };
