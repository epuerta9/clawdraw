#!/usr/bin/env bun
/**
 * ClawDraw Live Whiteboard
 *
 * Real-time canvas viewer that syncs with the server.
 * Claude uses CLI commands to make changes, this just displays them.
 *
 * Usage: clawdraw join <room-id>
 */

import { createCollabClient, type CollabUser } from "./client"
import { getTemplate, TEMPLATES } from "../canvas/types"

// Parse args
const args = process.argv.slice(2)
const roomId = args.find(a => !a.startsWith("--")) || "default"
const serverArg = args.indexOf("--server")
const defaultServer = process.env.CLAWDRAW_SERVER || "wss://clawdraw.cloudshipai.com/ws"
const serverUrl = serverArg !== -1 ? args[serverArg + 1] : defaultServer

// ANSI
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
}

const zoneColors: Record<string, string> = {
  strengths: "\x1b[32m", weaknesses: "\x1b[31m",
  opportunities: "\x1b[36m", threats: "\x1b[33m",
  key_partners: "\x1b[35m", key_activities: "\x1b[34m",
  key_resources: "\x1b[34m", value_props: "\x1b[31m",
  customer_rel: "\x1b[32m", channels: "\x1b[32m",
  customer_seg: "\x1b[33m", cost_structure: "\x1b[37m",
  revenue_streams: "\x1b[32m",
  problem: "\x1b[31m", solution: "\x1b[32m",
  backlog: "\x1b[37m", todo: "\x1b[34m",
  in_progress: "\x1b[33m", done: "\x1b[32m",
}

interface CanvasNode {
  id: string
  noteId: string
  zoneId?: string
}

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H")
}

function render(nodes: CanvasNode[], users: CollabUser[], templateId: string, connected: boolean) {
  clearScreen()

  const template = getTemplate(templateId) || TEMPLATES[0]
  const width = 62
  const now = new Date().toLocaleTimeString()

  // Header
  console.log(`${c.yellow}╔${"═".repeat(width)}╗${c.reset}`)
  console.log(`${c.yellow}║${c.reset} ${c.bright}🎨 CLAWDRAW${c.reset}  ${c.dim}${template?.name || "Canvas"}${c.reset}${" ".repeat(width - 25 - (template?.name?.length || 0))}${connected ? c.green + "● LIVE" : c.red + "○ OFFLINE"}${c.reset} ${c.yellow}║${c.reset}`)
  console.log(`${c.yellow}║${c.reset} ${c.dim}Room: ${roomId.slice(0, 30)}${c.reset}${" ".repeat(width - 8 - Math.min(30, roomId.length))} ${c.yellow}║${c.reset}`)
  console.log(`${c.yellow}╠${"═".repeat(width)}╣${c.reset}`)

  // Group by zone
  const byZone = new Map<string, CanvasNode[]>()
  for (const node of nodes) {
    const zone = node.zoneId || "items"
    if (!byZone.has(zone)) byZone.set(zone, [])
    byZone.get(zone)!.push(node)
  }

  // Render zones
  if (template?.zones && template.zones.length > 0) {
    for (const zone of template.zones) {
      const items = byZone.get(zone.name) || []
      const color = zoneColors[zone.name] || c.cyan

      console.log(`${c.yellow}║${c.reset} ${color}${zone.icon || "■"} ${zone.label.toUpperCase()}${c.reset} ${c.dim}(${items.length})${c.reset}${" ".repeat(width - zone.label.length - 8 - items.length.toString().length)}${c.yellow}║${c.reset}`)

      if (items.length === 0) {
        console.log(`${c.yellow}║${c.reset}   ${c.dim}—${c.reset}${" ".repeat(width - 5)}${c.yellow}║${c.reset}`)
      } else {
        for (const item of items.slice(0, 6)) {
          const text = (item.noteId || "").slice(0, width - 8)
          console.log(`${c.yellow}║${c.reset}   ${color}•${c.reset} ${text}${" ".repeat(Math.max(0, width - 6 - text.length))}${c.yellow}║${c.reset}`)
        }
        if (items.length > 6) {
          console.log(`${c.yellow}║${c.reset}   ${c.dim}+${items.length - 6} more${c.reset}${" ".repeat(width - 12 - (items.length - 6).toString().length)}${c.yellow}║${c.reset}`)
        }
      }
    }
  } else {
    // Freeform
    if (nodes.length === 0) {
      console.log(`${c.yellow}║${c.reset}   ${c.dim}(empty canvas)${c.reset}${" ".repeat(width - 17)}${c.yellow}║${c.reset}`)
    } else {
      for (const item of nodes.slice(0, 15)) {
        const text = (item.noteId || "").slice(0, width - 6)
        console.log(`${c.yellow}║${c.reset}   • ${text}${" ".repeat(Math.max(0, width - 5 - text.length))}${c.yellow}║${c.reset}`)
      }
    }
  }

  // Footer with users
  console.log(`${c.yellow}╠${"═".repeat(width)}╣${c.reset}`)
  const userNames = users.map(u => u.name.slice(0, 12)).join(", ").slice(0, width - 20)
  console.log(`${c.yellow}║${c.reset} ${c.dim}Users (${users.length}): ${userNames || "connecting..."}${c.reset}${" ".repeat(Math.max(0, width - 12 - users.length.toString().length - userNames.length))}${c.yellow}║${c.reset}`)
  console.log(`${c.yellow}║${c.reset} ${c.dim}Updated: ${now}${c.reset}${" ".repeat(width - 12 - now.length)}${c.dim}q=quit${c.reset} ${c.yellow}║${c.reset}`)
  console.log(`${c.yellow}╚${"═".repeat(width)}╝${c.reset}`)
}

async function main() {
  console.log(`${c.cyan}🔗 Connecting to ${roomId}...${c.reset}`)

  const client = createCollabClient(serverUrl!, roomId)

  let connected = false
  let users: CollabUser[] = []
  let nodes: CanvasNode[] = []
  let templateId = "swot"

  const update = () => render(nodes, users, templateId, connected)

  client.onConnected(() => {
    connected = true
    const canvas = client.getCanvas()
    if (canvas) templateId = canvas.templateId || "swot"
    nodes = client.getNodes()
    update()
  })

  client.onDisconnected(() => {
    connected = false
    update()
  })

  client.onUsers((newUsers) => {
    users = newUsers
    update()
  })

  client.onNodes(() => {
    nodes = client.getNodes()
    update()
  })

  // Handle quit
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on("data", (key) => {
      if (key.toString() === "q" || key.toString() === "\x03") { // q or Ctrl+C
        clearScreen()
        console.log(`${c.yellow}👋 Disconnected from ${roomId}${c.reset}\n`)
        client.disconnect()
        process.exit(0)
      }
      if (key.toString() === "r") { // r to refresh
        update()
      }
    })
  }

  process.on("SIGINT", () => {
    clearScreen()
    client.disconnect()
    process.exit(0)
  })

  // Initial render
  render(nodes, users, templateId, connected)
}

main().catch((err) => {
  console.error(`${c.red}Error: ${err.message}${c.reset}`)
  process.exit(1)
})
