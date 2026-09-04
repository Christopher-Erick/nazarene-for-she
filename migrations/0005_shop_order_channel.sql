-- Tag shop orders by how they were placed. Existing rows default to the website checkout.
PRAGMA foreign_keys = ON;

ALTER TABLE shop_orders ADD COLUMN channel TEXT NOT NULL DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_shop_orders_channel ON shop_orders(channel, status, created_at);
