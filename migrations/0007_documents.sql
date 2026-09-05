-- Organisation document approval desk. These files are never published.

INSERT OR IGNORE INTO permissions (id, module, action, description) VALUES
  ('documents.view', 'documents', 'view', 'view documents'),
  ('documents.create', 'documents', 'create', 'create documents'),
  ('documents.edit', 'documents', 'edit', 'edit documents'),
  ('documents.delete', 'documents', 'delete', 'delete documents'),
  ('documents.approve', 'documents', 'approve', 'approve documents'),
  ('documents.publish', 'documents', 'publish', 'publish documents');

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM permissions WHERE module = 'documents';

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions WHERE module = 'documents' AND action != 'publish';

INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
  ('chair', 'documents.view'),
  ('chair', 'documents.create'),
  ('chair', 'documents.approve'),
  ('vice_chair', 'documents.view'),
  ('vice_chair', 'documents.approve'),
  ('secretary', 'documents.view'),
  ('secretary', 'documents.create'),
  ('secretary', 'documents.edit'),
  ('secretary', 'documents.approve'),
  ('vice_secretary', 'documents.view'),
  ('vice_secretary', 'documents.approve'),
  ('treasurer', 'documents.view'),
  ('treasurer', 'documents.create'),
  ('treasurer', 'documents.approve');

CREATE TABLE IF NOT EXISTS document_items (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('requisition', 'minutes', 'proof_of_payment')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'changes_requested', 'approved', 'declined', 'archived')
  ),
  current_stage_index INTEGER NOT NULL DEFAULT 0,
  current_stage_role TEXT NOT NULL DEFAULT '',
  submitter_id TEXT NOT NULL REFERENCES users(id),
  due_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  decline_note TEXT NOT NULL DEFAULT '',
  archived_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_action_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS document_files (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES document_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  UNIQUE (item_id, version)
);

CREATE TABLE IF NOT EXISTS document_events (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES document_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  stage_role TEXT NOT NULL DEFAULT '',
  stage_index INTEGER,
  action TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT NOT NULL DEFAULT '',
  on_behalf_of_role TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS document_comments (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES document_items(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS document_officers (
  role_key TEXT PRIMARY KEY CHECK (
    role_key IN ('chair', 'vice_chair', 'secretary', 'vice_secretary', 'treasurer', 'patron')
  ),
  user_id TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO document_officers (role_key, user_id, updated_by, updated_at) VALUES
  ('chair', NULL, NULL, 0),
  ('vice_chair', NULL, NULL, 0),
  ('secretary', NULL, NULL, 0),
  ('vice_secretary', NULL, NULL, 0),
  ('treasurer', NULL, NULL, 0),
  ('patron', NULL, NULL, 0);

CREATE INDEX IF NOT EXISTS idx_document_items_status ON document_items(status, last_action_at);
CREATE INDEX IF NOT EXISTS idx_document_items_type ON document_items(type, status);
CREATE INDEX IF NOT EXISTS idx_document_items_submitter ON document_items(submitter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_events_item ON document_events(item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_files_item ON document_files(item_id, version);
CREATE INDEX IF NOT EXISTS idx_document_comments_item ON document_comments(item_id, created_at);
