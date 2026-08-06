import { describe, expect, it } from 'vitest';
import { fromCents, toCents } from './money';

describe('money', () => {
  it('converte valores brasileiros para centavos sem perda de precisão', () => {
    expect(toCents('1.234,56')).toBe(123456);
    expect(toCents(69.9)).toBe(6990);
    expect(fromCents(6990)).toBe(69.9);
  });
});
