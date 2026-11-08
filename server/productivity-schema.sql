-- Additive tables: no business data is seeded or rewritten.
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entries TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS task_templates_workspace ON task_templates(workspace);
CREATE TABLE IF NOT EXISTS task_template_runs (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES task_templates(id) ON DELETE SET NULL,
  tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
  template_version INTEGER NOT NULL,
  tour_version INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS task_template_runs_workspace ON task_template_runs(workspace);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tour_id TEXT REFERENCES tours(id) ON DELETE SET NULL,
  payload TEXT NOT NULL,
  total INTEGER NOT NULL CHECK(total >= 0),
  status TEXT NOT NULL CHECK(status IN ('draft','pending','approved','rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quotes_workspace ON quotes(workspace);
CREATE TABLE IF NOT EXISTS quote_audit (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  version INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payload TEXT NOT NULL,
  note TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS quote_audit_quote ON quote_audit(quote_id);
