ALTER TABLE products ADD COLUMN stock_location TEXT NOT NULL DEFAULT 'STOCK'
  CHECK(stock_location IN ('PAINT_STOCK', 'STOCK', 'STORE'));
