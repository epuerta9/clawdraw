import { getDb } from "./client"

export const SCHEMA = `
-- Canvases (workspaces/boards)
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'freeform', -- 'freeform', 'mindmap', 'swot', 'persona', 'journey'
  metadata TEXT, -- JSON for canvas-specific settings
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Nodes (items on canvas)
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'text', 'persona', 'painpoint', 'opportunity', 'swot_strength', 'swot_weakness', etc.
  content TEXT NOT NULL, -- main text content
  metadata TEXT, -- JSON for type-specific data (color, icon, priority, etc.)
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  width REAL DEFAULT 200,
  height REAL DEFAULT 100,
  parent_id TEXT REFERENCES nodes(id) ON DELETE SET NULL, -- for hierarchical structures
  z_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Connections (relationships between nodes)
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'arrow', -- 'arrow', 'line', 'dashed', 'bidirectional'
  label TEXT, -- relationship label
  metadata TEXT, -- JSON for style (color, thickness, etc.)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tags for organization
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Node-Tag junction
CREATE TABLE IF NOT EXISTS node_tags (
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);

-- AI Conversations (for context)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  canvas_id TEXT REFERENCES canvases(id) ON DELETE SET NULL,
  node_id TEXT REFERENCES nodes(id) ON DELETE SET NULL,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_canvas ON nodes(canvas_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_connections_canvas ON connections(canvas_id);
CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_id);
`

export async function initSchema(): Promise<void> {
  const db = getDb()
  await db.executeMultiple(SCHEMA)
  console.log("✓ Database schema initialized")
}
