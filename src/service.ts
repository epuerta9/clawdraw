import { getDb } from "./db/client"
import { v4 as uuid } from "uuid"
import type { InValue } from "@libsql/client"

// Types
export type NoteType = "note" | "persona" | "painpoint" | "idea" | "goal" | "question" | "swot_s" | "swot_w" | "swot_o" | "swot_t"
export type CollectionType = "canvas" | "mindmap" | "swot" | "persona_set" | "project"

export interface Note {
  id: string
  type: NoteType
  title: string
  content?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  type: CollectionType
  description?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Link {
  id: string
  sourceId: string
  targetId: string
  label?: string
  strength: number
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

// Service functions
export async function createNote(
  type: NoteType,
  title: string,
  content?: string,
  metadata?: Record<string, unknown>
): Promise<Note> {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO notes (id, type, title, content, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, type, title, content ?? null, metadata ? JSON.stringify(metadata) : null, now, now],
  })

  return { id, type, title, content, metadata, createdAt: now, updatedAt: now }
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content" | "metadata" | "type">>
): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()
  const sets: string[] = ["updated_at = ?"]
  const args: InValue[] = [now]

  if (updates.title !== undefined) {
    sets.push("title = ?")
    args.push(updates.title)
  }
  if (updates.content !== undefined) {
    sets.push("content = ?")
    args.push(updates.content)
  }
  if (updates.type !== undefined) {
    sets.push("type = ?")
    args.push(updates.type)
  }
  if (updates.metadata !== undefined) {
    sets.push("metadata = ?")
    args.push(JSON.stringify(updates.metadata))
  }

  args.push(id)
  await db.execute({
    sql: `UPDATE notes SET ${sets.join(", ")} WHERE id = ?`,
    args,
  })
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: "DELETE FROM notes WHERE id = ?", args: [id] })
}

export async function getNote(id: string): Promise<Note | null> {
  const db = getDb()
  const result = await db.execute({ sql: "SELECT * FROM notes WHERE id = ?", args: [id] })
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row["id"] as string,
    type: row["type"] as NoteType,
    title: row["title"] as string,
    content: row["content"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }
}

export async function listNotes(type?: NoteType, limit = 50): Promise<Note[]> {
  const db = getDb()
  const sql = type
    ? "SELECT * FROM notes WHERE type = ? ORDER BY updated_at DESC LIMIT ?"
    : "SELECT * FROM notes ORDER BY updated_at DESC LIMIT ?"
  const args: InValue[] = type ? [type, limit] : [limit]
  const result = await db.execute({ sql, args })

  return result.rows.map((row) => ({
    id: row["id"] as string,
    type: row["type"] as NoteType,
    title: row["title"] as string,
    content: row["content"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }))
}

export async function searchNotes(query: string, limit = 20): Promise<Note[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT ?`,
    args: [`%${query}%`, `%${query}%`, limit],
  })

  return result.rows.map((row) => ({
    id: row["id"] as string,
    type: row["type"] as NoteType,
    title: row["title"] as string,
    content: row["content"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }))
}

// Links
export async function linkNotes(
  sourceId: string,
  targetId: string,
  label?: string,
  strength = 1
): Promise<Link> {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT OR REPLACE INTO links (id, source_id, target_id, label, strength, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, sourceId, targetId, label ?? null, strength, now],
  })

  return { id, sourceId, targetId, label, strength, createdAt: now }
}

export async function unlinkNotes(sourceId: string, targetId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: "DELETE FROM links WHERE source_id = ? AND target_id = ?",
    args: [sourceId, targetId],
  })
}

export async function getLinkedNotes(noteId: string): Promise<{ note: Note; link: Link; direction: "outgoing" | "incoming" }[]> {
  const db = getDb()

  // Get outgoing links
  const outgoing = await db.execute({
    sql: `SELECT n.*, l.id as link_id, l.source_id, l.target_id, l.label, l.strength, l.created_at as link_created
          FROM notes n
          JOIN links l ON n.id = l.target_id
          WHERE l.source_id = ?`,
    args: [noteId],
  })

  // Get incoming links
  const incoming = await db.execute({
    sql: `SELECT n.*, l.id as link_id, l.source_id, l.target_id, l.label, l.strength, l.created_at as link_created
          FROM notes n
          JOIN links l ON n.id = l.source_id
          WHERE l.target_id = ?`,
    args: [noteId],
  })

  const results: { note: Note; link: Link; direction: "outgoing" | "incoming" }[] = []

  for (const row of outgoing.rows) {
    results.push({
      direction: "outgoing",
      note: {
        id: row["id"] as string,
        type: row["type"] as NoteType,
        title: row["title"] as string,
        content: row["content"] as string | undefined,
        metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
        createdAt: row["created_at"] as string,
        updatedAt: row["updated_at"] as string,
      },
      link: {
        id: row["link_id"] as string,
        sourceId: row["source_id"] as string,
        targetId: row["target_id"] as string,
        label: row["label"] as string | undefined,
        strength: row["strength"] as number,
        createdAt: row["link_created"] as string,
      },
    })
  }

  for (const row of incoming.rows) {
    results.push({
      direction: "incoming",
      note: {
        id: row["id"] as string,
        type: row["type"] as NoteType,
        title: row["title"] as string,
        content: row["content"] as string | undefined,
        metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
        createdAt: row["created_at"] as string,
        updatedAt: row["updated_at"] as string,
      },
      link: {
        id: row["link_id"] as string,
        sourceId: row["source_id"] as string,
        targetId: row["target_id"] as string,
        label: row["label"] as string | undefined,
        strength: row["strength"] as number,
        createdAt: row["link_created"] as string,
      },
    })
  }

  return results
}

// Collections
export async function createCollection(
  name: string,
  type: CollectionType,
  description?: string
): Promise<Collection> {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO collections (id, name, type, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, name, type, description ?? null, now, now],
  })

  return { id, name, type, description, createdAt: now, updatedAt: now }
}

export async function listCollections(type?: CollectionType): Promise<Collection[]> {
  const db = getDb()
  const sql = type
    ? "SELECT * FROM collections WHERE type = ? ORDER BY updated_at DESC"
    : "SELECT * FROM collections ORDER BY updated_at DESC"
  const args: InValue[] = type ? [type] : []
  const result = await db.execute({ sql, args })

  return result.rows.map((row) => ({
    id: row["id"] as string,
    name: row["name"] as string,
    type: row["type"] as CollectionType,
    description: row["description"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }))
}

export async function addNoteToCollection(collectionId: string, noteId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT OR IGNORE INTO collection_notes (collection_id, note_id) VALUES (?, ?)`,
    args: [collectionId, noteId],
  })
}

export async function getCollectionNotes(collectionId: string): Promise<Note[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT n.* FROM notes n
          JOIN collection_notes cn ON n.id = cn.note_id
          WHERE cn.collection_id = ?
          ORDER BY cn.added_at`,
    args: [collectionId],
  })

  return result.rows.map((row) => ({
    id: row["id"] as string,
    type: row["type"] as NoteType,
    title: row["title"] as string,
    content: row["content"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }))
}

// Tags
export async function createTag(name: string, color = "#6366f1"): Promise<Tag> {
  const db = getDb()
  const id = uuid()
  await db.execute({
    sql: `INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)`,
    args: [id, name, color],
  })
  return { id, name, color }
}

export async function tagNote(noteId: string, tagName: string): Promise<void> {
  const db = getDb()
  // Get or create tag
  let result = await db.execute({ sql: "SELECT id FROM tags WHERE name = ?", args: [tagName] })
  let tagId: string
  if (result.rows.length === 0) {
    const tag = await createTag(tagName)
    tagId = tag.id
  } else {
    tagId = result.rows[0]!["id"] as string
  }
  await db.execute({
    sql: `INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`,
    args: [noteId, tagId],
  })
}

export async function getNoteTags(noteId: string): Promise<Tag[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT t.* FROM tags t
          JOIN note_tags nt ON t.id = nt.tag_id
          WHERE nt.note_id = ?`,
    args: [noteId],
  })
  return result.rows.map((row) => ({
    id: row["id"] as string,
    name: row["name"] as string,
    color: row["color"] as string,
  }))
}

export async function getNotesByTag(tagName: string): Promise<Note[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT n.* FROM notes n
          JOIN note_tags nt ON n.id = nt.note_id
          JOIN tags t ON t.id = nt.tag_id
          WHERE t.name = ?
          ORDER BY n.updated_at DESC`,
    args: [tagName],
  })
  return result.rows.map((row) => ({
    id: row["id"] as string,
    type: row["type"] as NoteType,
    title: row["title"] as string,
    content: row["content"] as string | undefined,
    metadata: row["metadata"] ? JSON.parse(row["metadata"] as string) : undefined,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  }))
}
