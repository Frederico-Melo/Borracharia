ALTER TABLE sales ADD COLUMN card_installments INTEGER CHECK(card_installments BETWEEN 1 AND 12);
ALTER TABLE sales ADD COLUMN card_fee_bps INTEGER CHECK(card_fee_bps >= 0);
ALTER TABLE sales ADD COLUMN card_fee_cents INTEGER CHECK(card_fee_cents >= 0);
ALTER TABLE sales ADD COLUMN card_gross_cents INTEGER CHECK(card_gross_cents >= 0);
ALTER TABLE sales ADD COLUMN card_installment_cents INTEGER CHECK(card_installment_cents >= 0);
