import { getDb } from "./client"

export const SCHEMA = `
-- Ideas/Notes (the core unit)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'note', -- 'note', 'persona', 'painpoint', 'idea', 'goal', 'question', 'swot_s', 'swot_w', 'swot_o', 'swot_t'
  title TEXT NOT NULL,
  content TEXT, -- markdown content
  metadata TEXT, -- JSON for type-specific data
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Collections (group notes together)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'canvas', -- 'canvas', 'mindmap', 'swot', 'persona_set', 'project'
  description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Links between notes (bidirectional relationships)
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  label TEXT, -- relationship label: 'relates_to', 'blocks', 'parent_of', 'leads_to', etc.
  strength INTEGER DEFAULT 1, -- 1-5 how strong the connection is
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source_id, target_id)
);

-- Note membership in collections
CREATE TABLE IF NOT EXISTS collection_notes (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  position_x REAL DEFAULT 0, -- for canvas layout
  position_y REAL DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (collection_id, note_id)
);

-- Tags for cross-cutting organization
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
CREATE INDEX IF NOT EXISTS idx_collection_notes_collection ON collection_notes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_notes_note ON collection_notes(note_id);
`

export async function initSchema(): Promise<void> {
  const db = getDb()
  await db.executeMultiple(SCHEMA)
}
