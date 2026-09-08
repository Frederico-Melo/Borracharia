-- Peças avulsas não pertencem ao estoque, mas precisam guardar o custo e o preço
-- usados no momento da venda. SQLite não permite ampliar o CHECK existente, por
-- isso a tabela é recriada preservando integralmente todos os itens já gravados.
CREATE TABLE sale_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('PRODUCT','SERVICE','LABOR','PART')),
  product_id INTEGER REFERENCES products(id),
  service_code TEXT CHECK(service_code IN ('ALIGNMENT','BALANCING')),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(unit_cost_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0)
);

INSERT INTO sale_items_new (
  id, sale_id, item_type, product_id, service_code, description, quantity,
  unit_price_cents, unit_cost_cents, total_cents
)
SELECT
  id, sale_id, item_type, product_id, service_code, description, quantity,
  unit_price_cents, unit_cost_cents, total_cents
FROM sale_items;

DROP TABLE sale_items;
ALTER TABLE sale_items_new RENAME TO sale_items;

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
