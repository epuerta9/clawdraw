import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { render } from "@opentui/react"
import React from "react"
import { App } from "./App"
import { initSchema, getDb, closeDb } from "./db"
import { getStore, type NodeType } from "./state"

// Node type quick-add key mappings
const QUICK_ADD_KEYS: Record<string, NodeType> = {
  i: "idea",
  p: "painpoint",
  o: "opportunity",
  u: "persona",
  g: "goal",
  t: "task",
  q: "question",
}

async function main() {
  console.log("🎨 Starting bizcanvas...")

  // Check for database URL
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("❌ TURSO_DATABASE_URL environment variable is required")
    console.log("\nSet up your environment:")
    console.log("  export TURSO_DATABASE_URL=libsql://bizcanvas-<user>.turso.io")
    console.log("  export TURSO_AUTH_TOKEN=<your-token>")
    console.log("\nOr create a .env file with these values")
    process.exit(1)
  }

  // Initialize database
  try {
    await initSchema()
  } catch (err) {
    console.error("❌ Failed to initialize database:", err)
    process.exit(1)
  }

  // Create renderer
  const renderer = await createCliRenderer({
    targetFps: 30,
    consoleOptions: {
      startInDebugMode: false,
    },
  })

  const store = getStore()
  let lastMessage = ""

  // Handle quit
  const quit = async () => {
    renderer.stop()
    await closeDb()
    console.log("\n👋 Goodbye!")
    process.exit(0)
  }

  // Message handler for status updates
  const handleMessage = (msg: string) => {
    lastMessage = msg
  }

  // Render React app
  render(<App onQuit={quit} onMessage={handleMessage} />, renderer)

  // Key handler
  renderer.keyInput.on("keypress", async (key: KeyEvent) => {
    const state = store.getState()

    // Quit
    if (key.name === "q" && !key.ctrl && !key.meta) {
      await quit()
      return
    }
    if (key.ctrl && key.name === "c") {
      await quit()
      return
    }

    // Mode switching
    if (key.name === "v") {
      store.dispatch({ type: "SET_MODE", payload: "view" })
    } else if (key.name === "e") {
      store.dispatch({ type: "SET_MODE", payload: "edit" })
    } else if (key.name === "c" && !key.ctrl) {
      store.dispatch({ type: "SET_MODE", payload: "connect" })
    } else if (key.name === "a") {
      store.dispatch({ type: "SET_MODE", payload: "ai" })
    }

    // Quick add nodes (when canvas is selected)
    if (state.currentCanvas && QUICK_ADD_KEYS[key.name]) {
      const type = QUICK_ADD_KEYS[key.name]
      const nodeCount = state.nodes.length
      const x = (nodeCount % 4) * 220 + 50
      const y = Math.floor(nodeCount / 4) * 120 + 50

      try {
        const node = await store.createNode(type, `New ${type}`, { x, y })
        store.dispatch({ type: "SELECT_NODE", payload: node.id })
      } catch (err) {
        console.error("Failed to create node:", err)
      }
    }

    // New canvas
    if (key.name === "n") {
      try {
        await store.createCanvas("New Canvas", "freeform")
      } catch (err) {
        console.error("Failed to create canvas:", err)
      }
    }

    // List canvases
    if (key.name === "l") {
      try {
        const canvases = await store.listCanvases()
        if (canvases.length > 0) {
          // Load first canvas for now (TODO: canvas picker)
          await store.loadCanvas(canvases[0].id)
        }
      } catch (err) {
        console.error("Failed to list canvases:", err)
      }
    }

    // Delete selected node
    if (key.name === "d" && state.selectedNodeId) {
      try {
        await store.deleteNode(state.selectedNodeId)
        store.dispatch({ type: "SELECT_NODE", payload: null })
      } catch (err) {
        console.error("Failed to delete node:", err)
      }
    }

    // Navigation with arrow keys
    if (state.nodes.length > 0) {
      const currentIndex = state.nodes.findIndex((n) => n.id === state.selectedNodeId)

      if (key.name === "down" || key.name === "j") {
        const nextIndex = (currentIndex + 1) % state.nodes.length
        store.dispatch({ type: "SELECT_NODE", payload: state.nodes[nextIndex].id })
      } else if (key.name === "up" || key.name === "k") {
        const prevIndex = currentIndex <= 0 ? state.nodes.length - 1 : currentIndex - 1
        store.dispatch({ type: "SELECT_NODE", payload: state.nodes[prevIndex].id })
      }
    }

    // Toggle console (for debugging)
    if (key.name === "`" || key.name === "~") {
      renderer.console.toggle()
    }
  })

  // Start renderer loop
  renderer.start()

  console.log("✓ bizcanvas ready!")
  console.log("Press [n] to create a new canvas, [?] for help, [q] to quit")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
