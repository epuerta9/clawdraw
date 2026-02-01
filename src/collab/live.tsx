#!/usr/bin/env bun
/**
 * Collaborative Live Canvas
 *
 * Connect to bizcanvas-server and collaborate with other Claude instances.
 * Each user shows up as a colored cursor on the canvas.
 *
 * Usage: bun run collab:live <room-id> [--name "Claude-1"] [--server ws://localhost:1234]
 */

import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { CollabClient, createCollabClient, type CollabUser } from "./client"
import { getTemplate, TEMPLATES, type Template } from "../canvas/types"
import { initSchema } from "../db"
import * as noteService from "../service"
import type { Note } from "../service"

// Parse args
const args = process.argv.slice(2)
const roomId = args.find(a => !a.startsWith("--")) || "default"
const nameArg = args.indexOf("--name")
const userName = nameArg !== -1 ? args[nameArg + 1] : undefined
const serverArg = args.indexOf("--server")
const defaultServer = process.env.CLAWDRAW_SERVER || "wss://clawdraw.cloudshipai.com"
const serverUrl = serverArg !== -1 ? args[serverArg + 1] : defaultServer

// Load env
async function loadEnv() {
  const envPath = new URL("../../.env", import.meta.url).pathname
  const envFile = Bun.file(envPath)
  if (await envFile.exists()) {
    const text = await envFile.text()
    for (const line of text.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=")
        if (key) process.env[key] = valueParts.join("=")
      }
    }
  }
}

interface ViewerState {
  connected: boolean
  users: CollabUser[]
  canvas: { id: string; name: string; templateId: string } | null
  template: Template | null
  nodes: Array<{ id: string; noteId: string; x: number; y: number; zoneId?: string; color?: string }>
  notes: Map<string, Note>
  cursor: { x: number; y: number }
  message: string
}

async function main() {
  await loadEnv()
  await initSchema()

  console.log(`🔗 Connecting to ${serverUrl}/${roomId}...`)

  const renderer = await createCliRenderer({ targetFps: 15 })

  // Load notes from local DB
  const allNotes = await noteService.listNotes(undefined, 1000)
  const notesMap = new Map(allNotes.map(n => [n.id, n]))

  const state: ViewerState = {
    connected: false,
    users: [],
    canvas: null,
    template: null,
    nodes: [],
    notes: notesMap,
    cursor: { x: 40, y: 15 },
    message: "Connecting...",
  }

  // Create Y.js client
  const client = createCollabClient(serverUrl!, roomId, userName)

  client.onConnected(() => {
    state.connected = true
    state.canvas = client.getCanvas()
    state.template = state.canvas ? getTemplate(state.canvas.templateId) ?? null : null
    state.nodes = client.getNodes()
    state.message = `Connected to room: ${roomId}`
    render()
  })

  client.onDisconnected(() => {
    state.connected = false
    state.message = "Disconnected - reconnecting..."
    render()
  })

  client.onUsers((users) => {
    state.users = users
    render()
  })

  client.onNodes(() => {
    state.nodes = client.getNodes()
    render()
  })

  const root = createRoot(renderer)

  const render = () => {
    root.render(<CollabCanvas state={state} myUser={client.user} />)
  }

  render()

  // Key handler
  renderer.keyInput.on("keypress", async (key: KeyEvent) => {
    const step = 2

    // Move cursor
    if (key.name === "left" || key.name === "h") {
      state.cursor.x = Math.max(0, state.cursor.x - step)
      client.updateCursor(state.cursor.x, state.cursor.y)
      render()
    } else if (key.name === "right" || key.name === "l") {
      state.cursor.x += step
      client.updateCursor(state.cursor.x, state.cursor.y)
      render()
    } else if (key.name === "up" || key.name === "k") {
      state.cursor.y = Math.max(0, state.cursor.y - step)
      client.updateCursor(state.cursor.x, state.cursor.y)
      render()
    } else if (key.name === "down" || key.name === "j") {
      state.cursor.y += step
      client.updateCursor(state.cursor.x, state.cursor.y)
      render()
    }

    // Quit
    else if (key.name === "q") {
      client.disconnect()
      renderer.stop()
      process.exit(0)
    }
  })

  renderer.start()
}

// Canvas component
function CollabCanvas({ state, myUser }: { state: ViewerState; myUser: CollabUser }) {
  return (
    <box width="100%" height="100%" backgroundColor="#0f0f23" flexDirection="column">
      {/* Header */}
      <box height={3} backgroundColor="#1a1a2e" borderStyle="single" borderColor="#3d3d5c">
        <text fg="#ffcc00" paddingLeft={2} paddingTop={1}>
          ╔══ BIZCANVAS COLLAB ══╗
        </text>
        <text fg={state.connected ? "#00ff41" : "#ff6b6b"} position="absolute" right={2} top={1}>
          {state.connected ? "● LIVE" : "○ OFFLINE"}
        </text>
      </box>

      {/* Canvas area */}
      <box flexGrow={1} flexDirection="column" position="relative">
        {/* Draw template zones */}
        {state.template?.zones.map((zone) => (
          <box
            key={zone.id}
            position="absolute"
            left={zone.position.x}
            top={zone.position.y}
            width={zone.size.width}
            height={zone.size.height}
            borderStyle="single"
            borderColor={zone.color}
          >
            <text fg={zone.color}> {zone.icon ?? "■"} {zone.label}</text>
          </box>
        ))}

        {/* Draw nodes */}
        {state.nodes.map((node) => {
          const note = state.notes.get(node.noteId)
          return (
            <box
              key={node.id}
              position="absolute"
              left={node.x}
              top={node.y}
              width={20}
              height={3}
              backgroundColor="#1a1a2e"
              borderStyle="single"
              borderColor={node.color || "#ffcc00"}
            >
              <text fg={node.color || "#ffcc00"}>
                {note?.title?.slice(0, 16) || node.noteId.slice(0, 8)}
              </text>
            </box>
          )
        })}

        {/* Draw other users' cursors */}
        {state.users
          .filter(u => u.id !== myUser.id && u.cursor)
          .map((user) => (
            <text
              key={user.id}
              position="absolute"
              left={user.cursor!.x}
              top={user.cursor!.y}
              fg={user.color}
            >
              ●
            </text>
          ))}

        {/* My cursor */}
        <text
          position="absolute"
          left={state.cursor.x}
          top={state.cursor.y}
          fg={myUser.color}
        >
          ◆
        </text>
      </box>

      {/* User list sidebar */}
      <box
        position="absolute"
        right={0}
        top={3}
        width={20}
        height={state.users.length + 2}
        backgroundColor="#1a1a2e"
        borderStyle="single"
        borderColor="#3d3d5c"
      >
        <text fg="#ffcc00" paddingLeft={1}>USERS</text>
        {state.users.map((user, i) => (
          <text key={user.id} fg={user.color} top={i + 1} paddingLeft={1}>
            ● {user.name.slice(0, 12)}
          </text>
        ))}
      </box>

      {/* Status bar */}
      <box height={1} backgroundColor="#1a1a2e">
        <text fg="#00ff41" paddingLeft={1}>
          {state.message} │ {state.users.length} users │ arrows:move │ q:quit
        </text>
        <text fg="#666680" position="absolute" right={2}>
          {myUser.name}
        </text>
      </box>
    </box>
  )
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
