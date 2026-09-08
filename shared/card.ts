export const CARD_FEE_BPS: Readonly<Record<number, number>> = Object.freeze({
  1: 0,
  2: 399,
  3: 499,
  4: 659,
  5: 709,
  6: 769,
  7: 789,
  8: 859,
  9: 926,
  10: 999,
  11: 1179,
  12: 1199,
});

export type CardPayment = {
  installments: number;
  feePassed: boolean;
  feeBps: number;
  feeCents: number;
  grossCents: number;
  installmentCents: number;
  netCents: number;
};

export const calculateCardPayment = (desiredNetCents: number, installments: number, feePassed = true): CardPayment => {
  if (!Number.isInteger(desiredNetCents) || desiredNetCents < 0) throw new Error('Valor da venda inválido para cartão.');
  const feeBps = CARD_FEE_BPS[installments];
  if (feeBps === undefined) throw new Error('Quantidade de parcelas inválida.');

  const remainingBps = 10_000 - feeBps;
  if (!feePassed) {
    const grossCents = desiredNetCents;
    const feeCents = Math.round((grossCents * feeBps) / 10_000);
    return { installments, feePassed, feeBps, feeCents, grossCents, installmentCents: Math.floor(grossCents / installments), netCents: grossCents - feeCents };
  }
  let installmentCents = Math.ceil((desiredNetCents * 10_000) / (remainingBps * installments));
  let grossCents = installmentCents * installments;
  let feeCents = Math.round((grossCents * feeBps) / 10_000);

  while (grossCents - feeCents < desiredNetCents) {
    installmentCents += 1;
    grossCents = installmentCents * installments;
    feeCents = Math.round((grossCents * feeBps) / 10_000);
  }

  return { installments, feePassed, feeBps, feeCents, grossCents, installmentCents, netCents: grossCents - feeCents };
};
