#!/usr/bin/env bun
// Live Canvas Viewer - watches database and re-renders in real-time
import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { initSchema, closeDb } from "../db"
import { initCanvasSchema, getCanvas, listCanvases, updateViewport, createCanvas, autoPlaceNotes } from "./service"
import { getTemplate, TEMPLATES, type Template } from "./types"
import type { Canvas } from "./types"
import * as noteService from "../service"
import type { Note } from "../service"
import { LiveCanvas } from "./LiveCanvas"

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
  mode: "canvas" | "templates" | "canvases"
  canvas: Canvas | null
  template: Template | null
  notes: Map<string, Note>
  canvases: Canvas[]
  selectedIndex: number
  message: string
  lastUpdate: number
}

async function main() {
  await loadEnv()
  await initSchema()
  await initCanvasSchema()

  const args = process.argv.slice(2)
  const canvasId = args[0]

  const renderer = await createCliRenderer({ targetFps: 10 })

  // Load initial state
  let canvas: Canvas | null = null
  let template: Template | null = null

  if (canvasId) {
    canvas = await getCanvas(canvasId)
    if (canvas) {
      template = getTemplate(canvas.templateId) ?? null
    }
  }

  // Load all notes for reference
  const allNotes = await noteService.listNotes(undefined, 1000)
  const notesMap = new Map(allNotes.map(n => [n.id, n]))

  const state: ViewerState = {
    mode: canvas ? "canvas" : "templates",
    canvas,
    template,
    notes: notesMap,
    canvases: await listCanvases(),
    selectedIndex: 0,
    message: canvas ? "Live canvas - arrows:pan +/-:zoom q:quit" : "Select a template or existing canvas",
    lastUpdate: Date.now(),
  }

  const root = createRoot(renderer)

  const render = () => {
    if (state.mode === "canvas" && state.canvas && state.template) {
      root.render(
        <LiveCanvas
          canvas={state.canvas}
          template={state.template}
          notes={state.notes}
          width={80}
          height={24}
        />
      )
    } else if (state.mode === "templates") {
      root.render(<TemplateSelector state={state} />)
    } else if (state.mode === "canvases") {
      root.render(<CanvasSelector state={state} />)
    }
  }

  render()

  // Poll for updates every 500ms
  const pollInterval = setInterval(async () => {
    if (state.mode === "canvas" && state.canvas) {
      const updated = await getCanvas(state.canvas.id)
      if (updated && updated.updatedAt !== state.canvas.updatedAt) {
        state.canvas = updated
        // Reload notes
        const freshNotes = await noteService.listNotes(undefined, 1000)
        state.notes = new Map(freshNotes.map(n => [n.id, n]))
        state.lastUpdate = Date.now()
        render()
      }
    }
  }, 500)

  // Key handler
  renderer.keyInput.on("keypress", async (key: KeyEvent) => {
    if (state.mode === "templates") {
      if (key.name === "down" || key.name === "j") {
        state.selectedIndex = Math.min(state.selectedIndex + 1, TEMPLATES.length - 1)
        render()
      } else if (key.name === "up" || key.name === "k") {
        state.selectedIndex = Math.max(state.selectedIndex - 1, 0)
        render()
      } else if (key.name === "return" || key.name === "enter") {
        // Create new canvas from template
        const tmpl = TEMPLATES[state.selectedIndex]
        if (tmpl) {
          const newCanvas = await createCanvas(`New ${tmpl.name}`, tmpl.id)
          state.canvas = await getCanvas(newCanvas.id)
          state.template = tmpl
          state.mode = "canvas"
          state.message = `Created ${tmpl.name} - arrows:pan q:quit`
          render()
        }
      } else if (key.name === "c") {
        state.mode = "canvases"
        state.canvases = await listCanvases()
        state.selectedIndex = 0
        render()
      } else if (key.name === "q") {
        clearInterval(pollInterval)
        renderer.stop()
        await closeDb()
        process.exit(0)
      }
    } else if (state.mode === "canvases") {
      if (key.name === "down" || key.name === "j") {
        state.selectedIndex = Math.min(state.selectedIndex + 1, state.canvases.length - 1)
        render()
      } else if (key.name === "up" || key.name === "k") {
        state.selectedIndex = Math.max(state.selectedIndex - 1, 0)
        render()
      } else if (key.name === "return" || key.name === "enter") {
        const selected = state.canvases[state.selectedIndex]
        if (selected) {
          state.canvas = await getCanvas(selected.id)
          state.template = getTemplate(selected.templateId) ?? null
          state.mode = "canvas"
          render()
        }
      } else if (key.name === "t") {
        state.mode = "templates"
        state.selectedIndex = 0
        render()
      } else if (key.name === "q") {
        clearInterval(pollInterval)
        renderer.stop()
        await closeDb()
        process.exit(0)
      }
    } else if (state.mode === "canvas" && state.canvas) {
      const step = 5

      if (key.name === "left" || key.name === "h") {
        state.canvas.viewport.x = Math.max(0, state.canvas.viewport.x - step)
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.name === "right" || key.name === "l") {
        state.canvas.viewport.x += step
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.name === "up" || key.name === "k") {
        state.canvas.viewport.y = Math.max(0, state.canvas.viewport.y - step)
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.name === "down" || key.name === "j") {
        state.canvas.viewport.y += step
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.sequence === "+" || key.sequence === "=") {
        state.canvas.viewport.zoom = Math.min(3, state.canvas.viewport.zoom + 0.1)
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.sequence === "-" || key.sequence === "_") {
        state.canvas.viewport.zoom = Math.max(0.5, state.canvas.viewport.zoom - 0.1)
        await updateViewport(state.canvas.id, state.canvas.viewport)
        render()
      } else if (key.name === "t") {
        state.mode = "templates"
        state.selectedIndex = 0
        render()
      } else if (key.name === "c") {
        state.mode = "canvases"
        state.canvases = await listCanvases()
        state.selectedIndex = 0
        render()
      } else if (key.name === "q") {
        clearInterval(pollInterval)
        renderer.stop()
        await closeDb()
        process.exit(0)
      }
    }
  })

  renderer.start()
}

// Template selector component
function TemplateSelector({ state }: { state: ViewerState }) {
  return (
    <box width="100%" height="100%" backgroundColor="#0f0f23" flexDirection="column">
      <box height={3} backgroundColor="#1a1a2e" borderStyle="single" borderColor="#3d3d5c">
        <text fg="#ffcc00" paddingLeft={2} paddingTop={1}>
          ╔══ BIZCANVAS TEMPLATES ══╗
        </text>
      </box>

      <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
        <text fg="#ffcc00">┌─ SELECT TEMPLATE ────────────────────────────────┐</text>

        {TEMPLATES.map((tmpl, i) => {
          const selected = i === state.selectedIndex
          const color = selected ? "#ffd700" : "#cccccc"
          const prefix = selected ? "►" : " "

          return (
            <text key={tmpl.id} fg={color}>
              │{prefix}{tmpl.icon} {tmpl.name.padEnd(20)} {tmpl.description.slice(0, 25)} │
            </text>
          )
        })}

        <text fg="#ffcc00">└──────────────────────────────────────────────────┘</text>

        <box paddingTop={1}>
          <text fg="#666680">
            ↑↓ navigate │ enter create │ c existing canvases │ q quit
          </text>
        </box>
      </box>
    </box>
  )
}

// Canvas selector component
function CanvasSelector({ state }: { state: ViewerState }) {
  return (
    <box width="100%" height="100%" backgroundColor="#0f0f23" flexDirection="column">
      <box height={3} backgroundColor="#1a1a2e" borderStyle="single" borderColor="#3d3d5c">
        <text fg="#ffcc00" paddingLeft={2} paddingTop={1}>
          ╔══ EXISTING CANVASES ══╗
        </text>
      </box>

      <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
        <text fg="#ffcc00">┌─ SELECT CANVAS ──────────────────────────────────┐</text>

        {state.canvases.length === 0 && (
          <text fg="#666680">│ (no canvases yet - press t to create from template) │</text>
        )}

        {state.canvases.map((canvas, i) => {
          const selected = i === state.selectedIndex
          const color = selected ? "#ffd700" : "#cccccc"
          const prefix = selected ? "►" : " "
          const tmpl = getTemplate(canvas.templateId)

          return (
            <text key={canvas.id} fg={color}>
              │{prefix}{tmpl?.icon ?? "□"} {canvas.name.slice(0, 30).padEnd(30)} [{canvas.templateId}] │
            </text>
          )
        })}

        <text fg="#ffcc00">└──────────────────────────────────────────────────┘</text>

        <box paddingTop={1}>
          <text fg="#666680">
            ↑↓ navigate │ enter open │ t templates │ q quit
          </text>
        </box>
      </box>
    </box>
  )
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
