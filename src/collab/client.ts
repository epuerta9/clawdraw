/**
 * BizCanvas Collaborative Client
 *
 * Connects to bizcanvas-server via Y.js/WebSocket
 * Enables multiple Claude instances to collaborate in real-time
 */

import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

export interface CollabUser {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
}

export interface CollabClientOptions {
  serverUrl: string
  roomId: string
  userName?: string
}

export class CollabClient {
  private doc: Y.Doc
  private provider: WebsocketProvider
  private roomId: string
  private userId: string
  private userName: string
  private color = "#00ff41"

  // Y.js shared types
  private canvasMap: Y.Map<unknown>
  private nodesArray: Y.Array<unknown>

  // Event callbacks
  private onUsersChange?: (users: CollabUser[]) => void
  private onNodesChange?: () => void
  private onConnect?: () => void
  private onDisconnect?: () => void

  constructor(options: CollabClientOptions) {
    this.roomId = options.roomId
    this.userId = Math.random().toString(36).slice(2, 10)
    this.userName = options.userName || `Claude-${this.userId.slice(0, 4)}`

    // Create Y.js document
    this.doc = new Y.Doc()

    // Get shared types
    this.canvasMap = this.doc.getMap("canvas")
    this.nodesArray = this.doc.getArray("nodes")

    // Connect via WebSocket
    const wsUrl = options.serverUrl.replace("http", "ws")
    this.provider = new WebsocketProvider(
      wsUrl,
      this.roomId,
      this.doc,
      { params: { name: this.userName } }
    )

    // Set awareness (cursor/presence)
    this.provider.awareness.setLocalState({
      user: {
        id: this.userId,
        name: this.userName,
        color: this.color,
        cursor: null,
      },
    })

    // Listen for connection changes
    this.provider.on("status", (event: { status: string }) => {
      if (event.status === "connected") {
        console.log(`🔗 Connected to room: ${this.roomId}`)
        this.onConnect?.()
      } else if (event.status === "disconnected") {
        console.log(`👋 Disconnected from room: ${this.roomId}`)
        this.onDisconnect?.()
      }
    })

    // Listen for awareness changes (other users)
    this.provider.awareness.on("change", () => {
      const users = this.getUsers()
      this.onUsersChange?.(users)
    })

    // Listen for document changes
    this.nodesArray.observe(() => {
      this.onNodesChange?.()
    })
  }

  // Get all connected users
  getUsers(): CollabUser[] {
    const states = this.provider.awareness.getStates()
    const users: CollabUser[] = []

    states.forEach((state, clientId) => {
      if (state.user) {
        users.push({
          id: state.user.id || clientId.toString(),
          name: state.user.name || "Anonymous",
          color: state.user.color || "#cccccc",
          cursor: state.user.cursor,
        })
      }
    })

    return users
  }

  // Update own cursor position
  updateCursor(x: number, y: number): void {
    this.provider.awareness.setLocalStateField("user", {
      id: this.userId,
      name: this.userName,
      color: this.color,
      cursor: { x, y },
    })
  }

  // Get canvas metadata
  getCanvas(): { id: string; name: string; templateId: string } | null {
    const id = this.canvasMap.get("id") as string | undefined
    if (!id) return null

    return {
      id,
      name: (this.canvasMap.get("name") as string) || id,
      templateId: (this.canvasMap.get("templateId") as string) || "brainstorm",
    }
  }

  // Get all nodes
  getNodes(): Array<{
    id: string
    noteId: string
    x: number
    y: number
    zoneId?: string
    color?: string
  }> {
    return this.nodesArray.toArray() as any[]
  }

  // Add a node
  addNode(node: {
    id: string
    noteId: string
    x: number
    y: number
    zoneId?: string
    color?: string
  }): void {
    this.nodesArray.push([{
      ...node,
      createdBy: this.userId,
      createdAt: Date.now(),
    }])
  }

  // Move a node
  moveNode(nodeId: string, x: number, y: number): void {
    const nodes = this.nodesArray.toArray() as any[]
    const index = nodes.findIndex((n: any) => n.id === nodeId)

    if (index !== -1) {
      const node = nodes[index]
      this.doc.transact(() => {
        this.nodesArray.delete(index, 1)
        this.nodesArray.insert(index, [{
          ...node,
          x,
          y,
          lastEditedBy: this.userId,
          lastEditedAt: Date.now(),
        }])
      })
    }
  }

  // Remove a node
  removeNode(nodeId: string): void {
    const nodes = this.nodesArray.toArray() as any[]
    const index = nodes.findIndex((n: any) => n.id === nodeId)

    if (index !== -1) {
      this.nodesArray.delete(index, 1)
    }
  }

  // Event handlers
  onUsers(callback: (users: CollabUser[]) => void): void {
    this.onUsersChange = callback
    // Immediately call with current users
    callback(this.getUsers())
  }

  onNodes(callback: () => void): void {
    this.onNodesChange = callback
  }

  onConnected(callback: () => void): void {
    this.onConnect = callback
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnect = callback
  }

  // Disconnect
  disconnect(): void {
    this.provider.disconnect()
    this.doc.destroy()
  }

  // Get connection status
  get isConnected(): boolean {
    return this.provider.wsconnected
  }

  // Get own user info
  get user(): CollabUser {
    return {
      id: this.userId,
      name: this.userName,
      color: this.color,
    }
  }
}

// Helper to create a client
export function createCollabClient(
  serverUrl: string,
  roomId: string,
  userName?: string
): CollabClient {
  return new CollabClient({ serverUrl, roomId, userName })
}
