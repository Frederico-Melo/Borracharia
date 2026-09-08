ALTER TABLE sales ADD COLUMN card_fee_passed INTEGER NOT NULL DEFAULT 1 CHECK(card_fee_passed IN (0,1));
