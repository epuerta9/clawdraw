import type { AppState, Action, Node, Connection, Canvas, Tag } from "./types"
import { v4 as uuid } from "uuid"
import { getDb } from "../db"

// Initial state
export const initialState: AppState = {
  currentCanvas: null,
  nodes: [],
  connections: [],
  tags: [],
  selectedNodeId: null,
  focusedNodeId: null,
  mode: "view",
}

// Reducer
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_CANVAS":
      return { ...state, currentCanvas: action.payload }
    case "SET_NODES":
      return { ...state, nodes: action.payload }
    case "ADD_NODE":
      return { ...state, nodes: [...state.nodes, action.payload] }
    case "UPDATE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
      }
    case "DELETE_NODE":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.payload),
        connections: state.connections.filter(
          (c) => c.sourceId !== action.payload && c.targetId !== action.payload
        ),
      }
    case "SET_CONNECTIONS":
      return { ...state, connections: action.payload }
    case "ADD_CONNECTION":
      return { ...state, connections: [...state.connections, action.payload] }
    case "DELETE_CONNECTION":
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
      }
    case "SELECT_NODE":
      return { ...state, selectedNodeId: action.payload }
    case "FOCUS_NODE":
      return { ...state, focusedNodeId: action.payload }
    case "SET_MODE":
      return { ...state, mode: action.payload }
    case "SET_TAGS":
      return { ...state, tags: action.payload }
    default:
      return state
  }
}

// Store class with persistence
export class Store {
  private state: AppState
  private listeners: Set<(state: AppState) => void> = new Set()

  constructor(initial: AppState = initialState) {
    this.state = initial
  }

  getState(): AppState {
    return this.state
  }

  dispatch(action: Action): void {
    this.state = reducer(this.state, action)
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Canvas operations
  async loadCanvas(id: string): Promise<Canvas | null> {
    const db = getDb()
    const result = await db.execute({
      sql: "SELECT * FROM canvases WHERE id = ?",
      args: [id],
    })
    if (result.rows.length === 0) return null

    const row = result.rows[0]
    const canvas: Canvas = {
      id: row.id as string,
      name: row.name as string,
      type: row.type as Canvas["type"],
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
    this.dispatch({ type: "SET_CANVAS", payload: canvas })

    // Load nodes and connections
    await this.loadNodes(id)
    await this.loadConnections(id)

    return canvas
  }

  async createCanvas(name: string, type: Canvas["type"] = "freeform"): Promise<Canvas> {
    const db = getDb()
    const id = uuid()
    const now = new Date().toISOString()

    await db.execute({
      sql: "INSERT INTO canvases (id, name, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      args: [id, name, type, now, now],
    })

    const canvas: Canvas = { id, name, type, createdAt: now, updatedAt: now }
    this.dispatch({ type: "SET_CANVAS", payload: canvas })
    this.dispatch({ type: "SET_NODES", payload: [] })
    this.dispatch({ type: "SET_CONNECTIONS", payload: [] })

    return canvas
  }

  async listCanvases(): Promise<Canvas[]> {
    const db = getDb()
    const result = await db.execute("SELECT * FROM canvases ORDER BY updated_at DESC")
    return result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      type: row.type as Canvas["type"],
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }))
  }

  // Node operations
  async loadNodes(canvasId: string): Promise<void> {
    const db = getDb()
    const result = await db.execute({
      sql: "SELECT * FROM nodes WHERE canvas_id = ? ORDER BY z_index",
      args: [canvasId],
    })

    const nodes: Node[] = result.rows.map((row) => ({
      id: row.id as string,
      canvasId: row.canvas_id as string,
      type: row.type as Node["type"],
      content: row.content as string,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      position: { x: row.position_x as number, y: row.position_y as number },
      size: { width: row.width as number, height: row.height as number },
      parentId: row.parent_id as string | undefined,
      zIndex: row.z_index as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }))

    this.dispatch({ type: "SET_NODES", payload: nodes })
  }

  async createNode(
    type: Node["type"],
    content: string,
    position: { x: number; y: number } = { x: 0, y: 0 },
    parentId?: string
  ): Promise<Node> {
    const canvas = this.state.currentCanvas
    if (!canvas) throw new Error("No canvas selected")

    const db = getDb()
    const id = uuid()
    const now = new Date().toISOString()
    const zIndex = Math.max(0, ...this.state.nodes.map((n) => n.zIndex)) + 1

    await db.execute({
      sql: `INSERT INTO nodes (id, canvas_id, type, content, position_x, position_y, parent_id, z_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, canvas.id, type, content, position.x, position.y, parentId ?? null, zIndex, now, now],
    })

    const node: Node = {
      id,
      canvasId: canvas.id,
      type,
      content,
      position,
      size: { width: 200, height: 100 },
      parentId,
      zIndex,
      createdAt: now,
      updatedAt: now,
    }

    this.dispatch({ type: "ADD_NODE", payload: node })
    return node
  }

  async updateNode(id: string, updates: Partial<Node>): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    const sets: string[] = ["updated_at = ?"]
    const args: unknown[] = [now]

    if (updates.content !== undefined) {
      sets.push("content = ?")
      args.push(updates.content)
    }
    if (updates.position !== undefined) {
      sets.push("position_x = ?, position_y = ?")
      args.push(updates.position.x, updates.position.y)
    }
    if (updates.size !== undefined) {
      sets.push("width = ?, height = ?")
      args.push(updates.size.width, updates.size.height)
    }
    if (updates.metadata !== undefined) {
      sets.push("metadata = ?")
      args.push(JSON.stringify(updates.metadata))
    }
    if (updates.zIndex !== undefined) {
      sets.push("z_index = ?")
      args.push(updates.zIndex)
    }

    args.push(id)
    await db.execute({
      sql: `UPDATE nodes SET ${sets.join(", ")} WHERE id = ?`,
      args,
    })

    this.dispatch({ type: "UPDATE_NODE", payload: { id, ...updates, updatedAt: now } })
  }

  async deleteNode(id: string): Promise<void> {
    const db = getDb()
    await db.execute({ sql: "DELETE FROM nodes WHERE id = ?", args: [id] })
    this.dispatch({ type: "DELETE_NODE", payload: id })
  }

  // Connection operations
  async loadConnections(canvasId: string): Promise<void> {
    const db = getDb()
    const result = await db.execute({
      sql: "SELECT * FROM connections WHERE canvas_id = ?",
      args: [canvasId],
    })

    const connections: Connection[] = result.rows.map((row) => ({
      id: row.id as string,
      canvasId: row.canvas_id as string,
      sourceId: row.source_id as string,
      targetId: row.target_id as string,
      type: row.type as Connection["type"],
      label: row.label as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      createdAt: row.created_at as string,
    }))

    this.dispatch({ type: "SET_CONNECTIONS", payload: connections })
  }

  async createConnection(
    sourceId: string,
    targetId: string,
    type: Connection["type"] = "arrow",
    label?: string
  ): Promise<Connection> {
    const canvas = this.state.currentCanvas
    if (!canvas) throw new Error("No canvas selected")

    const db = getDb()
    const id = uuid()
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO connections (id, canvas_id, source_id, target_id, type, label, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, canvas.id, sourceId, targetId, type, label ?? null, now],
    })

    const connection: Connection = {
      id,
      canvasId: canvas.id,
      sourceId,
      targetId,
      type,
      label,
      createdAt: now,
    }

    this.dispatch({ type: "ADD_CONNECTION", payload: connection })
    return connection
  }

  async deleteConnection(id: string): Promise<void> {
    const db = getDb()
    await db.execute({ sql: "DELETE FROM connections WHERE id = ?", args: [id] })
    this.dispatch({ type: "DELETE_CONNECTION", payload: id })
  }
}

// Singleton store instance
let store: Store | null = null

export function getStore(): Store {
  if (!store) {
    store = new Store()
  }
  return store
}
