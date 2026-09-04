-- Shop commerce: products live in the 14 (and later) garment categories.
-- Categories remain content_items type 'atelier'. SKU is assigned by the app, never typed by hand.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shop_sku_counters (
  prefix TEXT PRIMARY KEY,
  next_n INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES content_items(id),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_kes INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  sizing TEXT NOT NULL DEFAULT 'body' CHECK (sizing IN ('body', 'one')),
  cloths TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (
    status IN ('placed', 'awaiting_payment', 'paid', 'in_workshop', 'ready', 'fulfilled', 'cancelled')
  ),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  gift INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  delivery_notes TEXT NOT NULL DEFAULT '',
  subtotal_kes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES shop_products(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL,
  unit_price_kes INTEGER NOT NULL,
  fit TEXT NOT NULL DEFAULT '',
  cloth TEXT NOT NULL DEFAULT '',
  line_total_kes INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_shop_products_status ON shop_products(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_shop_orders_email ON shop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);

INSERT OR IGNORE INTO shop_products (
  id, category_id, sku, name, slug, summary, description, price_kes, stock, image,
  sizing, cloths, status, sort_order, created_by, updated_by, created_at, updated_at, published_at, deleted_at
) VALUES
  ('product-dress-01', 'atelier-dress', 'NFS-DRESS-0001', 'Dress from the workshop', 'dress-from-workshop', 'A dress cut and sewn in the workshop — work she can name as her own.', 'Dresses are sewn in the Kawangware atelier. Choose a cloth and a fit. Pay through the official details shown at checkout.', 4500, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-skirt-01', 'atelier-skirt', 'NFS-SKIRT-0001', 'Skirt from the workshop', 'skirt-from-workshop', 'A skirt from the same tables where she learned the machine.', 'Skirts are sewn as training becomes livelihood. Choose a fit and a cloth, then pay through official channels.', 3200, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-blouse-01', 'atelier-blouse', 'NFS-BLOUSE-0001', 'Blouse from the workshop', 'blouse-from-workshop', 'A blouse finished by hands that are learning a trade.', 'Blouses are part of dressmaking practice. The piece you order is made in the Kawangware workshop.', 2800, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-palazzo-01', 'atelier-palazzo', 'NFS-PALAZZO-0001', 'Palazzo from the workshop', 'palazzo-from-workshop', 'Wide-leg palazzos cut so a girl can sell the ease she sewed.', 'Palazzos are made in the workshop. Tell us a cloth and a fit at checkout.', 3500, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-kimono-01', 'atelier-kimono', 'NFS-KIMONO-0001', 'Kimono from the workshop', 'kimono-from-workshop', 'A kimono wrapped from the same cloth she is learning to honour.', 'Kimonos and wraps are sewn in the atelier. Choose a cloth on the table, then complete checkout.', 3800, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-crop-top-01', 'atelier-crop-top', 'NFS-CROPTOP-0001', 'Crop top from the workshop', 'crop-top-from-workshop', 'A crop top finished on the machines where she is becoming a tailor.', 'Crop tops are made as part of dressmaking practice. Choose a fit and a cloth.', 2200, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-jumpsuit-01', 'atelier-jumpsuit', 'NFS-JUMPSUIT-0001', 'Jumpsuit from the workshop', 'jumpsuit-from-workshop', 'A jumpsuit joined at the same seam she is learning to trust.', 'Jumpsuits are a fuller make: cut, fit and finish in the Kawangware workshop.', 4800, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-uniform-01', 'atelier-uniform', 'NFS-UNIFORM-0001', 'Uniform from the workshop', 'uniform-from-workshop', 'A uniform sewn so a girl can be paid for work that looks like dignity.', 'Uniforms are made in the Kawangware workshop as part of vocational training.', 4200, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-trouser-01', 'atelier-trouser', 'NFS-TROUSER-0001', 'Trouser from the workshop', 'trouser-from-workshop', 'Trousers tailored on the tables where she is building a trade.', 'Trousers are sewn in the workshop. Choose a fit and a cloth at checkout.', 3400, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-jacket-01', 'atelier-jacket', 'NFS-JACKET-0001', 'Jacket from the workshop', 'jacket-from-workshop', 'A jacket lined by hands that are learning structure, not only style.', 'Jackets take longer in the workshop. Stock on this page is what is currently available.', 5000, 6, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-sweater-01', 'atelier-sweater', 'NFS-SWEATER-0001', 'Sweater from the workshop', 'sweater-from-workshop', 'A sweater finished so her warmth can also be her wage.', 'Sweaters are made in the workshop. Choose a size and a cloth preference.', 3000, 8, '', 'body', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-tote-01', 'atelier-tote', 'NFS-TOTE-0001', 'Tote bag from the workshop', 'tote-from-workshop', 'A tote bag she carried through every step — cut, stitch, finish.', 'Tote bags are sewn in the Kawangware atelier as part of vocational training.', 1500, 12, '', 'one', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-kitenge-01', 'atelier-kitenge', 'NFS-KITENGE-0001', 'Kitenge from the workshop', 'kitenge-from-workshop', 'A kitenge wrapped from cloth she is learning to cut with care.', 'Kitenges are cut and finished in the workshop. Choose a cloth, then complete checkout.', 2500, 8, '', 'one', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL),
  ('product-cap-01', 'atelier-cap', 'NFS-CAP-0001', 'Cap from the workshop', 'cap-from-workshop', 'A cap finished by a girl whose skill is becoming a livelihood.', 'Caps are made in the workshop. Choose a cloth at checkout.', 800, 12, '', 'one', '["plum","gold","ivory","wax"]', 'published', 0, NULL, NULL, 1756800000000, 1756800000000, 1756800000000, NULL);

INSERT OR IGNORE INTO shop_sku_counters (prefix, next_n) VALUES
  ('NFS-DRESS', 2),
  ('NFS-SKIRT', 2),
  ('NFS-BLOUSE', 2),
  ('NFS-PALAZZO', 2),
  ('NFS-KIMONO', 2),
  ('NFS-CROPTOP', 2),
  ('NFS-JUMPSUIT', 2),
  ('NFS-UNIFORM', 2),
  ('NFS-TROUSER', 2),
  ('NFS-JACKET', 2),
  ('NFS-SWEATER', 2),
  ('NFS-TOTE', 2),
  ('NFS-KITENGE', 2),
  ('NFS-CAP', 2);
