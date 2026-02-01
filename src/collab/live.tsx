#!/usr/bin/env bun
/**
 * Collaborative Live Canvas
 *
 * Connect to ClawDraw server and collaborate in real-time.
 * Shows canvas updates as they happen.
 *
 * Usage: bun run src/collab/live.tsx <room-id> [--server wss://...]
 */

import { createCollabClient, type CollabUser } from "./client"
import { getTemplate, TEMPLATES, type Template } from "../canvas/types"
import readline from "readline"

// Parse args
const args = process.argv.slice(2)
const roomId = args.find(a => !a.startsWith("--")) || "default"
const serverArg = args.indexOf("--server")
const defaultServer = process.env.CLAWDRAW_SERVER || "wss://clawdraw.cloudshipai.com/ws"
const serverUrl = serverArg !== -1 ? args[serverArg + 1] : defaultServer

// ANSI colors
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  bg: "\x1b[48;2;15;15;35m",
}

// Zone colors for SWOT
const zoneColors: Record<string, string> = {
  strengths: "\x1b[32m",      // green
  weaknesses: "\x1b[31m",     // red
  opportunities: "\x1b[36m",  // cyan
  threats: "\x1b[33m",        // yellow
  // BMC
  key_partners: "\x1b[35m",
  key_activities: "\x1b[34m",
  key_resources: "\x1b[34m",
  value_props: "\x1b[31m",
  customer_rel: "\x1b[32m",
  channels: "\x1b[32m",
  customer_seg: "\x1b[33m",
  cost_structure: "\x1b[37m",
  revenue_streams: "\x1b[32m",
}

interface CanvasNode {
  id: string
  noteId: string  // This is the text content
  x: number
  y: number
  zoneId?: string
  color?: string
}

function renderCanvas(nodes: CanvasNode[], templateId: string = "swot") {
  const template = getTemplate(templateId) || TEMPLATES[0]
  const width = 60

  console.log(`\n${c.yellow}╔${"═".repeat(width)}╗${c.reset}`)
  console.log(`${c.yellow}║${c.reset}  ${c.bright}📋 ${template?.name || "Canvas"}${c.reset}${" ".repeat(width - 6 - (template?.name?.length || 6))}${c.yellow}║${c.reset}`)
  console.log(`${c.yellow}╠${"═".repeat(width)}╣${c.reset}`)

  // Group nodes by zone
  const byZone = new Map<string, CanvasNode[]>()
  for (const node of nodes) {
    const zone = node.zoneId || "unassigned"
    if (!byZone.has(zone)) byZone.set(zone, [])
    byZone.get(zone)!.push(node)
  }

  // Render each zone
  if (template?.zones) {
    for (const zone of template.zones) {
      const zoneNodes = byZone.get(zone.name) || []
      const color = zoneColors[zone.name] || c.cyan

      console.log(`${c.yellow}║${c.reset} ${color}${zone.icon || "■"} ${zone.label}${c.reset}${" ".repeat(width - zone.label.length - 4)}${c.yellow}║${c.reset}`)
      console.log(`${c.yellow}║${c.reset}  ${c.dim}${"─".repeat(width - 4)}${c.reset}  ${c.yellow}║${c.reset}`)

      if (zoneNodes.length === 0) {
        console.log(`${c.yellow}║${c.reset}    ${c.dim}(empty)${c.reset}${" ".repeat(width - 11)}${c.yellow}║${c.reset}`)
      } else {
        for (const node of zoneNodes.slice(0, 5)) {
          const text = (node.noteId || "").slice(0, width - 8)
          console.log(`${c.yellow}║${c.reset}    ${color}•${c.reset} ${text}${" ".repeat(Math.max(0, width - text.length - 7))}${c.yellow}║${c.reset}`)
        }
        if (zoneNodes.length > 5) {
          console.log(`${c.yellow}║${c.reset}    ${c.dim}... +${zoneNodes.length - 5} more${c.reset}${" ".repeat(width - 15)}${c.yellow}║${c.reset}`)
        }
      }
      console.log(`${c.yellow}║${c.reset}${" ".repeat(width)}${c.yellow}║${c.reset}`)
    }
  } else {
    // Freeform - just list all items
    if (nodes.length === 0) {
      console.log(`${c.yellow}║${c.reset}  ${c.dim}(no items yet)${c.reset}${" ".repeat(width - 16)}${c.yellow}║${c.reset}`)
    } else {
      for (const node of nodes.slice(0, 10)) {
        const text = (node.noteId || "").slice(0, width - 6)
        console.log(`${c.yellow}║${c.reset}  • ${text}${" ".repeat(Math.max(0, width - text.length - 4))}${c.yellow}║${c.reset}`)
      }
    }
  }

  console.log(`${c.yellow}╚${"═".repeat(width)}╝${c.reset}\n`)
}

function printStatus(connected: boolean, users: CollabUser[], roomId: string) {
  const status = connected ? `${c.green}● LIVE${c.reset}` : `${c.red}○ OFFLINE${c.reset}`
  const userList = users.map(u => u.name.slice(0, 10)).join(", ").slice(0, 30)
  console.log(`${c.dim}[${roomId.slice(0, 20)} | ${status} | ${users.length} users: ${userList || "..."}]${c.reset}`)
}

function printHelp() {
  console.log(`
${c.bright}Commands:${c.reset}
  ${c.cyan}/add <zone> <text>${c.reset}  Add item to zone (e.g. /add strengths "Great team")
  ${c.cyan}/view${c.reset}               Show canvas
  ${c.cyan}/users${c.reset}              Show connected users
  ${c.cyan}/clear${c.reset}              Clear screen
  ${c.cyan}/quit${c.reset}               Exit

${c.dim}SWOT zones: strengths, weaknesses, opportunities, threats${c.reset}
`)
}

async function main() {
  console.log(`\n${c.cyan}🔗 Connecting to ${serverUrl}/${roomId}...${c.reset}\n`)

  const client = createCollabClient(serverUrl!, roomId)

  let connected = false
  let users: CollabUser[] = []
  let nodes: CanvasNode[] = []
  let templateId = "swot"
  let autoRender = true

  client.onConnected(() => {
    connected = true
    const canvas = client.getCanvas()
    if (canvas) templateId = canvas.templateId || "swot"
    nodes = client.getNodes()

    console.log(`${c.green}✓ Connected to room: ${roomId}${c.reset}`)
    printStatus(connected, users, roomId)
    if (autoRender && nodes.length > 0) renderCanvas(nodes, templateId)
    printHelp()
  })

  client.onDisconnected(() => {
    connected = false
    console.log(`\n${c.red}⚠ Disconnected - reconnecting...${c.reset}`)
  })

  client.onUsers((newUsers) => {
    const joined = newUsers.filter(u => !users.find(ou => ou.id === u.id))
    const left = users.filter(u => !newUsers.find(nu => nu.id === u.id))
    users = newUsers

    for (const u of joined) {
      if (connected) console.log(`${c.green}→ ${u.name} joined${c.reset}`)
    }
    for (const u of left) {
      if (connected) console.log(`${c.dim}← ${u.name} left${c.reset}`)
    }
  })

  client.onNodes(() => {
    const oldCount = nodes.length
    nodes = client.getNodes()
    if (connected && nodes.length !== oldCount) {
      console.log(`${c.cyan}[Canvas updated: ${nodes.length} items]${c.reset}`)
      if (autoRender) renderCanvas(nodes, templateId)
    }
  })

  // Simple readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.cyan}>${c.reset} `,
  })

  rl.prompt()

  rl.on("line", (line) => {
    const input = line.trim()

    if (input.startsWith("/quit") || input.startsWith("/exit") || input === "q") {
      console.log(`\n${c.yellow}👋 Goodbye!${c.reset}\n`)
      client.disconnect()
      rl.close()
      process.exit(0)
    }

    if (input.startsWith("/clear")) {
      process.stdout.write("\x1b[2J\x1b[H")
      printStatus(connected, users, roomId)
    }

    if (input.startsWith("/view")) {
      renderCanvas(nodes, templateId)
    }

    if (input.startsWith("/users")) {
      console.log(`\n${c.bright}Connected Users (${users.length}):${c.reset}`)
      for (const user of users) {
        console.log(`  ${c.cyan}●${c.reset} ${user.name}`)
      }
      console.log()
    }

    if (input.startsWith("/auto")) {
      autoRender = !autoRender
      console.log(`Auto-render: ${autoRender ? "ON" : "OFF"}`)
    }

    if (input.startsWith("/add ")) {
      const match = input.match(/^\/add\s+(\w+)\s+["']?(.+?)["']?$/)
      if (match) {
        const [, zone, text] = match
        const nodeId = Math.random().toString(36).slice(2, 10)
        client.addNode({
          id: nodeId,
          noteId: text,
          x: Math.floor(Math.random() * 50),
          y: Math.floor(Math.random() * 20),
          zoneId: zone,
        })
        console.log(`${c.green}✓ Added to ${zone}: "${text}"${c.reset}`)
      } else {
        console.log(`${c.red}Usage: /add <zone> <text>${c.reset}`)
        console.log(`${c.dim}Example: /add strengths "Strong engineering team"${c.reset}`)
      }
    }

    if (input.startsWith("/help") || input === "?") {
      printHelp()
    }

    rl.prompt()
  })

  rl.on("close", () => {
    client.disconnect()
    process.exit(0)
  })

  process.on("SIGINT", () => {
    console.log(`\n${c.yellow}👋 Goodbye!${c.reset}\n`)
    client.disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(`${c.red}Error: ${err.message}${c.reset}`)
  process.exit(1)
})
