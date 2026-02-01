#!/usr/bin/env bun
/**
 * Collaborative Live Canvas - Simple Terminal Mode
 *
 * Connect to ClawDraw server and collaborate in real-time.
 * Uses simple text output instead of TUI for compatibility.
 *
 * Usage: bun run src/collab/live.tsx <room-id> [--server wss://...]
 */

import { createCollabClient, type CollabUser } from "./client"
import { getTemplate } from "../canvas/types"
import readline from "readline"

// Parse args
const args = process.argv.slice(2)
const roomId = args.find(a => !a.startsWith("--")) || "default"
const serverArg = args.indexOf("--server")
const defaultServer = process.env.CLAWDRAW_SERVER || "wss://clawdraw.cloudshipai.com/ws"
const serverUrl = serverArg !== -1 ? args[serverArg + 1] : defaultServer

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
}

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H")
}

function printHeader(connected: boolean, users: CollabUser[]) {
  console.log(`${colors.yellow}╔════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.yellow}║${colors.reset}  ${colors.bright}🎨 CLAWDRAW COLLAB${colors.reset}                                   ${colors.yellow}║${colors.reset}`)
  console.log(`${colors.yellow}║${colors.reset}  Room: ${colors.cyan}${roomId.slice(0, 40)}${colors.reset}${" ".repeat(Math.max(0, 40 - roomId.length))}   ${colors.yellow}║${colors.reset}`)
  console.log(`${colors.yellow}║${colors.reset}  Status: ${connected ? `${colors.green}● CONNECTED${colors.reset}` : `${colors.red}○ CONNECTING${colors.reset}`}                              ${colors.yellow}║${colors.reset}`)
  console.log(`${colors.yellow}╠════════════════════════════════════════════════════════╣${colors.reset}`)
  console.log(`${colors.yellow}║${colors.reset}  ${colors.bright}Users Online:${colors.reset} ${users.length}                                    ${colors.yellow}║${colors.reset}`)
  for (const user of users.slice(0, 5)) {
    const name = user.name.slice(0, 20).padEnd(20)
    console.log(`${colors.yellow}║${colors.reset}    ${colors.cyan}●${colors.reset} ${name}                              ${colors.yellow}║${colors.reset}`)
  }
  if (users.length > 5) {
    console.log(`${colors.yellow}║${colors.reset}    ${colors.dim}... and ${users.length - 5} more${colors.reset}                                  ${colors.yellow}║${colors.reset}`)
  }
  console.log(`${colors.yellow}╚════════════════════════════════════════════════════════╝${colors.reset}`)
}

function printHelp() {
  console.log(`
${colors.dim}Commands:${colors.reset}
  ${colors.cyan}/add <zone> <text>${colors.reset}  - Add item to zone
  ${colors.cyan}/list${colors.reset}               - List all items
  ${colors.cyan}/users${colors.reset}              - Show connected users
  ${colors.cyan}/quit${colors.reset}               - Exit

${colors.dim}SWOT zones: strengths, weaknesses, opportunities, threats${colors.reset}
`)
}

async function main() {
  console.log(`\n${colors.cyan}🔗 Connecting to ${serverUrl}/${roomId}...${colors.reset}\n`)

  const client = createCollabClient(serverUrl!, roomId)

  let connected = false
  let users: CollabUser[] = []
  let nodes: any[] = []

  client.onConnected(() => {
    connected = true
    clearScreen()
    printHeader(connected, users)
    printHelp()
    console.log(`${colors.green}✓ Connected! You can now collaborate in real-time.${colors.reset}\n`)
  })

  client.onDisconnected(() => {
    connected = false
    console.log(`\n${colors.red}⚠ Disconnected - attempting to reconnect...${colors.reset}`)
  })

  client.onUsers((newUsers) => {
    const oldCount = users.length
    users = newUsers
    if (connected && users.length !== oldCount) {
      console.log(`${colors.dim}[${users.length} users online]${colors.reset}`)
    }
  })

  client.onNodes(() => {
    nodes = client.getNodes()
    if (connected) {
      console.log(`${colors.dim}[Canvas updated - ${nodes.length} items]${colors.reset}`)
    }
  })

  // Simple readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.cyan}>${colors.reset} `,
  })

  rl.prompt()

  rl.on("line", (line) => {
    const input = line.trim()

    if (input.startsWith("/quit") || input.startsWith("/exit") || input === "q") {
      console.log(`\n${colors.yellow}👋 Goodbye!${colors.reset}\n`)
      client.disconnect()
      rl.close()
      process.exit(0)
    }

    if (input.startsWith("/users")) {
      console.log(`\n${colors.bright}Connected Users:${colors.reset}`)
      for (const user of users) {
        console.log(`  ${colors.cyan}●${colors.reset} ${user.name}`)
      }
      console.log()
    }

    if (input.startsWith("/list")) {
      console.log(`\n${colors.bright}Canvas Items:${colors.reset}`)
      if (nodes.length === 0) {
        console.log(`  ${colors.dim}(no items yet)${colors.reset}`)
      } else {
        for (const node of nodes) {
          console.log(`  ${colors.cyan}•${colors.reset} [${node.zoneId || "?"}] ${node.noteId.slice(0, 30)}`)
        }
      }
      console.log()
    }

    if (input.startsWith("/add ")) {
      const parts = input.slice(5).split(" ")
      const zone = parts[0]
      const text = parts.slice(1).join(" ")
      if (zone && text) {
        const nodeId = Math.random().toString(36).slice(2, 10)
        client.addNode({
          id: nodeId,
          noteId: text,
          x: Math.floor(Math.random() * 50),
          y: Math.floor(Math.random() * 20),
          zoneId: zone,
        })
        console.log(`${colors.green}✓ Added to ${zone}: "${text}"${colors.reset}`)
      } else {
        console.log(`${colors.red}Usage: /add <zone> <text>${colors.reset}`)
      }
    }

    if (input.startsWith("/help")) {
      printHelp()
    }

    if (input && !input.startsWith("/")) {
      // Treat as chat message / quick add
      console.log(`${colors.dim}Tip: Use /add <zone> <text> to add items${colors.reset}`)
    }

    rl.prompt()
  })

  rl.on("close", () => {
    client.disconnect()
    process.exit(0)
  })

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    console.log(`\n${colors.yellow}👋 Goodbye!${colors.reset}\n`)
    client.disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`)
  process.exit(1)
})
