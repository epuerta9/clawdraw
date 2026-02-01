// Canvas service - CRUD for canvases and nodes
import { v4 as uuid } from "uuid"
import { getDb } from "../db"
import type { Canvas, CanvasNode, Viewport, Position, Size, Template } from "./types"
import { getTemplate, TEMPLATES } from "./types"

export interface CanvasRow {
  id: string
  name: string
  template_id: string
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  metadata: string | null
  created_at: string
  updated_at: string
}

export interface CanvasNodeRow {
  id: string
  canvas_id: string
  note_id: string
  x: number
  y: number
  width: number
  height: number
  zone_id: string | null
  color: string | null
  style: string | null
  created_at: string
}

// Initialize canvas schema
export async function initCanvasSchema(): Promise<void> {
  const { CANVAS_SCHEMA } = await import("./schema")
  const db = getDb()
  await db.executeMultiple(CANVAS_SCHEMA)
}

// Create a new canvas from a template
export async function createCanvas(
  name: string,
  templateId: string,
  metadata?: Record<string, unknown>
): Promise<Canvas> {
  const template = getTemplate(templateId)
  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  const id = uuid()
  const db = getDb()

  await db.execute({
    sql: `INSERT INTO canvases (id, name, template_id, metadata) VALUES (?, ?, ?, ?)`,
    args: [id, name, templateId, metadata ? JSON.stringify(metadata) : null],
  })

  return {
    id,
    name,
    templateId,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Get a canvas with all its nodes
export async function getCanvas(canvasId: string): Promise<Canvas | null> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT * FROM canvases WHERE id = ?`,
    args: [canvasId],
  })

  if (result.rows.length === 0) return null

  const row = result.rows[0] as unknown as CanvasRow
  const nodes = await getCanvasNodes(canvasId)

  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    viewport: {
      x: row.viewport_x,
      y: row.viewport_y,
      zoom: row.viewport_zoom,
    },
    nodes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// List all canvases
export async function listCanvases(templateId?: string): Promise<Canvas[]> {
  const db = getDb()

  const sql = templateId
    ? `SELECT * FROM canvases WHERE template_id = ? ORDER BY updated_at DESC`
    : `SELECT * FROM canvases ORDER BY updated_at DESC`
  const args = templateId ? [templateId] : []

  const result = await db.execute({ sql, args })

  const canvases: Canvas[] = []
  for (const r of result.rows) {
    const row = r as unknown as CanvasRow
    canvases.push({
      id: row.id,
      name: row.name,
      templateId: row.template_id,
      viewport: {
        x: row.viewport_x,
        y: row.viewport_y,
        zoom: row.viewport_zoom,
      },
      nodes: [], // Don't load nodes for list
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  }

  return canvases
}

// Get nodes for a canvas
export async function getCanvasNodes(canvasId: string): Promise<CanvasNode[]> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT * FROM canvas_nodes WHERE canvas_id = ? ORDER BY created_at`,
    args: [canvasId],
  })

  return result.rows.map((r) => {
    const row = r as unknown as CanvasNodeRow
    return {
      id: row.id,
      noteId: row.note_id,
      position: { x: row.x, y: row.y },
      size: { width: row.width, height: row.height },
      zoneId: row.zone_id ?? undefined,
      color: row.color ?? undefined,
      style: (row.style as CanvasNode["style"]) ?? "sticky",
    }
  })
}

// Add a note to a canvas
export async function addNoteToCanvas(
  canvasId: string,
  noteId: string,
  position?: Position,
  zoneId?: string,
  size?: Size,
  color?: string
): Promise<CanvasNode> {
  const id = uuid()
  const db = getDb()

  const pos = position ?? { x: Math.random() * 80, y: Math.random() * 30 }
  const sz = size ?? { width: 20, height: 8 }

  await db.execute({
    sql: `INSERT INTO canvas_nodes (id, canvas_id, note_id, x, y, width, height, zone_id, color)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(canvas_id, note_id) DO UPDATE SET
            x = excluded.x, y = excluded.y, zone_id = excluded.zone_id, color = excluded.color`,
    args: [id, canvasId, noteId, pos.x, pos.y, sz.width, sz.height, zoneId ?? null, color ?? null],
  })

  // Update canvas timestamp
  await db.execute({
    sql: `UPDATE canvases SET updated_at = datetime('now') WHERE id = ?`,
    args: [canvasId],
  })

  return {
    id,
    noteId,
    position: pos,
    size: sz,
    zoneId,
    color,
    style: "sticky",
  }
}

// Move a node on the canvas
export async function moveNode(
  canvasId: string,
  nodeId: string,
  position: Position
): Promise<void> {
  const db = getDb()

  await db.execute({
    sql: `UPDATE canvas_nodes SET x = ?, y = ? WHERE id = ? AND canvas_id = ?`,
    args: [position.x, position.y, nodeId, canvasId],
  })

  await db.execute({
    sql: `UPDATE canvases SET updated_at = datetime('now') WHERE id = ?`,
    args: [canvasId],
  })
}

// Remove a node from canvas
export async function removeNodeFromCanvas(canvasId: string, nodeId: string): Promise<void> {
  const db = getDb()

  await db.execute({
    sql: `DELETE FROM canvas_nodes WHERE id = ? AND canvas_id = ?`,
    args: [nodeId, canvasId],
  })

  await db.execute({
    sql: `UPDATE canvases SET updated_at = datetime('now') WHERE id = ?`,
    args: [canvasId],
  })
}

// Update viewport
export async function updateViewport(canvasId: string, viewport: Viewport): Promise<void> {
  const db = getDb()

  await db.execute({
    sql: `UPDATE canvases SET viewport_x = ?, viewport_y = ?, viewport_zoom = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [viewport.x, viewport.y, viewport.zoom, canvasId],
  })
}

// Delete a canvas
export async function deleteCanvas(canvasId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `DELETE FROM canvases WHERE id = ?`,
    args: [canvasId],
  })
}

// Get all templates
export function listTemplates(): Template[] {
  return TEMPLATES
}

// Auto-place notes on a template based on note types
export async function autoPlaceNotes(
  canvasId: string,
  noteIds: string[]
): Promise<void> {
  const canvas = await getCanvas(canvasId)
  if (!canvas) throw new Error(`Canvas not found: ${canvasId}`)

  const template = getTemplate(canvas.templateId)
  if (!template || !template.autoPlace) return

  const { listNotes } = await import("../service")
  const notes = await listNotes(undefined, 1000)
  const noteMap = new Map(notes.map(n => [n.id, n]))

  // Group by zone based on note type
  const zoneCounters: Record<string, number> = {}

  for (const noteId of noteIds) {
    const note = noteMap.get(noteId)
    if (!note) continue

    // Find zone that accepts this note type
    const zone = template.zones.find(z =>
      z.allowedTypes?.includes(note.type)
    )

    if (zone) {
      const count = zoneCounters[zone.id] ?? 0
      zoneCounters[zone.id] = count + 1

      // Position within zone (stack vertically)
      const x = zone.position.x + 2
      const y = zone.position.y + 3 + count * 3

      await addNoteToCanvas(canvasId, noteId, { x, y }, zone.id, { width: zone.size.width - 4, height: 2 }, zone.color)
    }
  }
}
