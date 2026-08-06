CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('TIRE','WHEEL','VALVE')),
  brand TEXT,
  model TEXT,
  name TEXT,
  tire_width TEXT,
  tire_height TEXT,
  rim TEXT,
  tire_condition TEXT CHECK(tire_condition IN ('NOVO','REMODELADO')),
  bolt_pattern TEXT,
  wheel_width TEXT,
  valve_type TEXT,
  purchase_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(purchase_price_cents >= 0),
  sale_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(sale_price_cents >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  minimum_quantity INTEGER NOT NULL DEFAULT 2 CHECK(minimum_quantity >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_type_active ON products(type, active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(brand, model, name);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK(movement_type IN ('INITIAL','IN','OUT','ADJUSTMENT','SALE')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL CHECK(quantity_after >= 0),
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS service_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE CHECK(code IN ('ALIGNMENT','BALANCING')),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK(price_cents >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_number TEXT NOT NULL UNIQUE,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_type TEXT CHECK(discount_type IN ('FIXED','PERCENT')),
  discount_value INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  profit_cents INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH','PIX','CARD','OTHER')),
  notes TEXT,
  sold_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_plate ON sales(vehicle_plate);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('PRODUCT','SERVICE','LABOR')),
  product_id INTEGER REFERENCES products(id),
  service_code TEXT CHECK(service_code IN ('ALIGNMENT','BALANCING')),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(unit_cost_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

CREATE TABLE IF NOT EXISTS cash_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('IN','OUT')),
  category TEXT NOT NULL CHECK(category IN ('SALE','EXPENSE','PURCHASE','OTHER')),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  occurred_on TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_entries_occurred_on ON cash_entries(occurred_on DESC);
