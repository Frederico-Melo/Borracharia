import { describe, expect, it } from 'vitest';
import { CARD_FEE_BPS, calculateCardPayment } from '../../../shared/card';

describe('card payment', () => {
  it('mantém o valor líquido da venda ao repassar a taxa em parcelas', () => {
    const payment = calculateCardPayment(10_000, 2);
    expect(payment.feeBps).toBe(399);
    expect(payment.installmentCents).toBe(5_208);
    expect(payment.grossCents).toBe(10_416);
    expect(payment.feeCents).toBe(416);
    expect(payment.netCents).toBe(10_000);
  });

  it('não cobra taxa no cartão em uma parcela', () => {
    expect(calculateCardPayment(10_000, 1)).toMatchObject({ feeBps: 0, feeCents: 0, grossCents: 10_000, installmentCents: 10_000, netCents: 10_000 });
  });

  it('usa a tabela de taxas configurada para duas a doze parcelas', () => {
    expect(CARD_FEE_BPS).toMatchObject({ 2: 399, 3: 499, 4: 659, 5: 709, 6: 769, 7: 789, 8: 859, 9: 926, 10: 999, 11: 1179, 12: 1199 });
  });
});
