// Canvas database schema

export const CANVAS_SCHEMA = `
-- Canvases (instances of templates)
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  viewport_x REAL DEFAULT 0,
  viewport_y REAL DEFAULT 0,
  viewport_zoom REAL DEFAULT 1,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Canvas nodes (notes placed on canvas)
CREATE TABLE IF NOT EXISTS canvas_nodes (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  width REAL DEFAULT 20,
  height REAL DEFAULT 8,
  zone_id TEXT,
  color TEXT,
  style TEXT DEFAULT 'sticky',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(canvas_id, note_id)
);

-- Index for fast canvas lookups
CREATE INDEX IF NOT EXISTS idx_canvas_nodes_canvas ON canvas_nodes(canvas_id);
`
