-- AI sketch of each paper, plus a record that an officer actually opened the current file.

ALTER TABLE document_items ADD COLUMN summary TEXT NOT NULL DEFAULT '';
ALTER TABLE document_items ADD COLUMN summary_status TEXT NOT NULL DEFAULT 'none';

CREATE TABLE IF NOT EXISTS document_reads (
  item_id TEXT NOT NULL REFERENCES document_items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  opened_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, user_id, version)
);

CREATE INDEX IF NOT EXISTS idx_document_reads_user ON document_reads(user_id, opened_at);
