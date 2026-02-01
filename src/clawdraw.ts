#!/usr/bin/env bun
/**
 * ClawDraw CLI
 *
 * Terminal whiteboard for AI collaboration.
 * Works offline or connected to ClawDraw server.
 *
 * Usage:
 *   clawdraw board              - Open local board (offline)
 *   clawdraw board --connect    - Open board connected to server
 *   clawdraw join <room-id>     - Join collaborative room
 *   clawdraw login              - Login via GitHub
 *   clawdraw logout             - Clear saved credentials
 *   clawdraw rooms              - List your rooms (requires login)
 *   clawdraw create <name>      - Create a new room (requires login)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs"
import { homedir } from "os"
import { join } from "path"

// Config directory
const CONFIG_DIR = join(homedir(), ".clawdraw")
const TOKEN_FILE = join(CONFIG_DIR, "token")
const CONFIG_FILE = join(CONFIG_DIR, "config.json")

// Ensure config dir exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true })
}

interface Config {
  serverUrl: string
  token?: string
  userId?: string
  username?: string
}

function loadConfig(): Config {
  const defaults: Config = {
    serverUrl: process.env.CLAWDRAW_SERVER || "https://clawdraw.cloudshipai.com",
  }

  if (existsSync(CONFIG_FILE)) {
    try {
      const saved = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
      return { ...defaults, ...saved }
    } catch {
      return defaults
    }
  }

  // Also check for token file (legacy)
  if (existsSync(TOKEN_FILE)) {
    defaults.token = readFileSync(TOKEN_FILE, "utf-8").trim()
  }

  return defaults
}

function saveConfig(config: Config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function clearAuth() {
  const config = loadConfig()
  delete config.token
  delete config.userId
  delete config.username
  saveConfig(config)
  if (existsSync(TOKEN_FILE)) unlinkSync(TOKEN_FILE)
}

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

async function cmdLogin() {
  const config = loadConfig()

  console.log("\n🔐 ClawDraw Login\n")
  console.log("Opening browser for GitHub authentication...")
  console.log(`Server: ${config.serverUrl}\n`)

  // Start local callback server
  const callbackPort = 9876
  let receivedToken: string | null = null

  const server = Bun.serve({
    port: callbackPort,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token")
        const username = url.searchParams.get("username")

        if (token) {
          receivedToken = token
          config.token = token
          config.username = username || undefined
          saveConfig(config)

          return new Response(`
            <!DOCTYPE html>
            <html><head><style>
              body { font-family: monospace; background: #0f0f23; color: #00ff41;
                     display: flex; justify-content: center; align-items: center;
                     height: 100vh; margin: 0; }
              .box { text-align: center; }
            </style></head><body>
              <div class="box">
                <h1>✓ Logged in!</h1>
                <p>You can close this window and return to the terminal.</p>
              </div>
            </body></html>
          `, { headers: { "Content-Type": "text/html" } })
        }

        return new Response("Missing token", { status: 400 })
      }

      return new Response("Not found", { status: 404 })
    },
  })

  // Open browser with OAuth URL
  const authUrl = `${config.serverUrl}/auth/github?callback=http://localhost:${callbackPort}/callback`

  // Try to open browser
  const openCmd = process.platform === "darwin" ? "open" :
                  process.platform === "win32" ? "start" : "xdg-open"

  Bun.spawn([openCmd, authUrl], { stdout: "ignore", stderr: "ignore" })

  console.log(`If browser doesn't open, visit:\n${authUrl}\n`)
  console.log("Waiting for authentication...")

  // Wait for callback (timeout after 5 minutes)
  const startTime = Date.now()
  while (!receivedToken && Date.now() - startTime < 5 * 60 * 1000) {
    await Bun.sleep(500)
  }

  server.stop()

  if (receivedToken) {
    console.log(`\n✅ Logged in as ${config.username || "user"}`)
    console.log(`Token saved to ${CONFIG_FILE}\n`)
  } else {
    console.log("\n❌ Login timed out or was cancelled\n")
  }
}

async function cmdLogout() {
  clearAuth()
  console.log("\n✅ Logged out. Credentials cleared.\n")
}

async function cmdStatus() {
  const config = loadConfig()

  console.log("\n🎨 ClawDraw Status\n")
  console.log(`Server: ${config.serverUrl}`)
  console.log(`Logged in: ${config.token ? `Yes (${config.username || "user"})` : "No"}`)

  if (config.token) {
    // Try to verify token
    try {
      const res = await fetch(`${config.serverUrl}/api/subscription`, {
        headers: { Authorization: `Bearer ${config.token}` },
      })

      if (res.ok) {
        const data = await res.json() as { plan: string; usage: { rooms: number; maxRooms: number } }
        console.log(`Plan: ${data.plan}`)
        console.log(`Rooms: ${data.usage.rooms}/${data.usage.maxRooms === -1 ? "∞" : data.usage.maxRooms}`)
      } else {
        console.log("Token: Invalid (try logging in again)")
      }
    } catch {
      console.log("Server: Unreachable")
    }
  }

  console.log()
}

async function cmdRooms() {
  const config = loadConfig()

  if (!config.token) {
    console.log("\n❌ Not logged in. Run: clawdraw login\n")
    process.exit(1)
  }

  try {
    const res = await fetch(`${config.serverUrl}/api/rooms`, {
      headers: { Authorization: `Bearer ${config.token}` },
    })

    if (!res.ok) {
      console.log("\n❌ Failed to fetch rooms. Try logging in again.\n")
      process.exit(1)
    }

    const rooms = await res.json() as Array<{
      id: string
      name: string
      templateId: string
      activeUsers: number
      daysLeft: number | null
      isExpired: boolean
    }>

    console.log("\n╔══ YOUR ROOMS ══╗\n")

    if (rooms.length === 0) {
      console.log("  (no rooms yet)")
      console.log("  Create one: clawdraw create \"My Room\"\n")
    } else {
      for (const room of rooms) {
        const status = room.isExpired ? " [EXPIRED]" :
                       room.activeUsers > 0 ? ` [${room.activeUsers} live]` : ""
        const expires = room.daysLeft !== null && !room.isExpired ? ` (${room.daysLeft}d left)` : ""
        console.log(`  ${room.id}  ${room.name}${status}${expires}`)
        console.log(`    Template: ${room.templateId}`)
        console.log(`    Join: clawdraw join ${room.id}\n`)
      }
    }
  } catch (e) {
    console.log("\n❌ Could not connect to server\n")
    process.exit(1)
  }
}

async function cmdCreate(name: string, template = "swot") {
  const config = loadConfig()

  if (!config.token) {
    console.log("\n❌ Not logged in. Run: clawdraw login\n")
    process.exit(1)
  }

  try {
    const res = await fetch(`${config.serverUrl}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ name, templateId: template }),
    })

    if (!res.ok) {
      const err = await res.json() as { error: string }
      console.log(`\n❌ ${err.error}\n`)
      process.exit(1)
    }

    const room = await res.json() as { id: string; name: string }
    console.log(`\n✅ Room created: ${room.name}`)
    console.log(`   ID: ${room.id}`)
    console.log(`   Join: clawdraw join ${room.id}\n`)
  } catch {
    console.log("\n❌ Could not connect to server\n")
    process.exit(1)
  }
}

async function cmdBoard(connect = false) {
  const config = loadConfig()

  if (connect && !config.token) {
    console.log("\n⚠️  Not logged in. Running in offline mode.")
    console.log("   To connect: clawdraw login\n")
    connect = false
  }

  // Import and run the canvas live view
  console.log(connect ? "\n🔗 Starting connected board..." : "\n📋 Starting local board...")

  // Run the canvas:live script
  const proc = Bun.spawn(["bun", "run", "canvas:live"], {
    cwd: import.meta.dir.replace("/src", ""),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      CLAWDRAW_MODE: connect ? "connected" : "local",
      CLAWDRAW_TOKEN: config.token || "",
      CLAWDRAW_SERVER: config.serverUrl,
    },
  })

  await proc.exited
}

async function cmdJoin(roomId: string) {
  const config = loadConfig()

  // Convert HTTP URL to WebSocket URL with /ws/ path
  const wsUrl = config.serverUrl
    .replace("https://", "wss://")
    .replace("http://", "ws://")

  console.log(`\n🔗 Joining room: ${roomId}`)
  console.log(`   Server: ${wsUrl}/ws/${roomId}\n`)

  // Run the collab live script
  const proc = Bun.spawn(["bun", "run", "src/collab/live.tsx", roomId, "--server", `${wsUrl}/ws`], {
    cwd: import.meta.dir.replace("/src", ""),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      CLAWDRAW_SERVER: `${wsUrl}/ws`,
      CLAWDRAW_TOKEN: config.token || "",
    },
  })

  await proc.exited
}

async function cmdAdd(canvasId: string, zone: string, content: string) {
  // Run the canvas quick command
  const proc = Bun.spawn(["bun", "run", "canvas", "quick", canvasId, zone, content], {
    cwd: import.meta.dir.replace("/src", ""),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  })
  await proc.exited
}

async function cmdView(canvasId?: string) {
  const args = canvasId ? ["bun", "run", "canvas", "view", canvasId] : ["bun", "run", "canvas", "list"]
  const proc = Bun.spawn(args, {
    cwd: import.meta.dir.replace("/src", ""),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  })
  await proc.exited
}

async function cmdNew(template: string, name: string) {
  const proc = Bun.spawn(["bun", "run", "canvas", "create", template, name], {
    cwd: import.meta.dir.replace("/src", ""),
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  })
  await proc.exited
}

function printHelp() {
  console.log(`
🎨 ClawDraw - Terminal Whiteboard for AI

Usage:
  clawdraw board              Open local board (offline mode)
  clawdraw new <template> <name>  Create new canvas (swot, bmc, kanban)
  clawdraw add <id> <zone> <text> Add item to canvas zone
  clawdraw view [id]          View canvas or list all
  clawdraw join <room-id>     Join a collaborative room
  clawdraw rooms              List your online rooms
  clawdraw create <name>      Create online room
  clawdraw login              Login via GitHub
  clawdraw logout             Clear saved credentials
  clawdraw status             Show connection status
  clawdraw help               Show this help

Local Examples:
  clawdraw new swot "Q1 Strategy"          # Create SWOT canvas
  clawdraw add abc123 strengths "AI team"  # Add to strengths
  clawdraw view abc123                     # View canvas
  clawdraw board                           # Open live view

Online Examples:
  clawdraw login                           # Login to collaborate
  clawdraw create "Team SWOT" swot         # Create online room
  clawdraw join abc123                     # Join existing room

Environment:
  CLAWDRAW_SERVER   Server URL (default: https://clawdraw.cloudshipai.com)

Config: ~/.clawdraw/config.json
`)
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case "login":
    await cmdLogin()
    break

  case "logout":
    await cmdLogout()
    break

  case "status":
    await cmdStatus()
    break

  case "rooms":
  case "list":
    await cmdRooms()
    break

  case "create":
    if (!args[1]) {
      console.log("\n❌ Usage: clawdraw create <name> [template]\n")
      process.exit(1)
    }
    await cmdCreate(args[1], args[2] || "swot")
    break

  case "board":
    await cmdBoard(args.includes("--connect") || args.includes("-c"))
    break

  case "join":
    if (!args[1]) {
      console.log("\n❌ Usage: clawdraw join <room-id>\n")
      process.exit(1)
    }
    await cmdJoin(args[1])
    break

  case "new":
    if (!args[1] || !args[2]) {
      console.log("\n❌ Usage: clawdraw new <template> <name>")
      console.log("   Templates: swot, bmc, lean, kanban, brainstorm\n")
      process.exit(1)
    }
    await cmdNew(args[1], args.slice(2).join(" "))
    break

  case "add":
    if (!args[1] || !args[2] || !args[3]) {
      console.log("\n❌ Usage: clawdraw add <canvas-id> <zone> <content>")
      console.log("   Zones for SWOT: strengths, weaknesses, opportunities, threats\n")
      process.exit(1)
    }
    await cmdAdd(args[1], args[2], args.slice(3).join(" "))
    break

  case "view":
    await cmdView(args[1])
    break

  case "help":
  case "--help":
  case "-h":
  case undefined:
    printHelp()
    break

  default:
    console.log(`\n❌ Unknown command: ${command}`)
    printHelp()
    process.exit(1)
}
