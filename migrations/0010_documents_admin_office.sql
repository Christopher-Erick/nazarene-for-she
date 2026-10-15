-- The Patron office is now called Admin. Rebuild document_officers (its CHECK names the offices)
-- and carry any existing data across, including papers waiting on or decided by that office.

CREATE TABLE document_officers_next (
  role_key TEXT PRIMARY KEY CHECK (
    role_key IN ('chair', 'vice_chair', 'secretary', 'vice_secretary', 'treasurer', 'admin')
  ),
  user_id TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL
);

INSERT INTO document_officers_next (role_key, user_id, updated_by, updated_at)
SELECT CASE role_key WHEN 'patron' THEN 'admin' ELSE role_key END, user_id, updated_by, updated_at
FROM document_officers;

DROP TABLE document_officers;
ALTER TABLE document_officers_next RENAME TO document_officers;

INSERT OR IGNORE INTO document_officers (role_key, user_id, updated_by, updated_at) VALUES ('admin', NULL, NULL, 0);

UPDATE document_items SET current_stage_role = 'admin' WHERE current_stage_role = 'patron';
UPDATE document_events SET stage_role = 'admin' WHERE stage_role = 'patron';
UPDATE document_events SET on_behalf_of_role = 'admin' WHERE on_behalf_of_role = 'patron';
