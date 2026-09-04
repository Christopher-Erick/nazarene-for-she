-- Secret used so a public order page cannot be opened from the reference alone.
PRAGMA foreign_keys = ON;

ALTER TABLE shop_orders ADD COLUMN access_key TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_shop_orders_access_key ON shop_orders(access_key);
