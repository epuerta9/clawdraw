#!/usr/bin/env bun
import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { initSchema, closeDb } from "../db"
import * as service from "../service"
import type { Note, Collection } from "../service"
import { App } from "./App"

// Viewer state
export interface ViewerState {
  view: "list" | "detail" | "swot" | "links" | "collections"
  notes: Note[]
  collections: Collection[]
  selectedIndex: number
  selectedNote: Note | null
  selectedCollection: Collection | null
  linkedNotes: { note: Note; link: service.Link; direction: "outgoing" | "incoming" }[]
  swotNotes: Note[]
  filter: service.NoteType | null
  message: string
}

async function main() {
  // Load env from package dir
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

  await initSchema()

  const renderer = await createCliRenderer({
    targetFps: 30,
  })

  // Initial state
  const state: ViewerState = {
    view: "list",
    notes: await service.listNotes(undefined, 100),
    collections: await service.listCollections(),
    selectedIndex: 0,
    selectedNote: null,
    selectedCollection: null,
    linkedNotes: [],
    swotNotes: [],
    filter: null,
    message: "↑↓ navigate │ enter select │ l list │ s swot │ c collections │ q quit",
  }

  const refresh = async () => {
    state.notes = await service.listNotes(state.filter ?? undefined, 100)
    state.collections = await service.listCollections()
  }

  const root = createRoot(renderer)
  const render = () => root.render(<App state={state} />)
  render()

  // Key handler
  renderer.keyInput.on("keypress", async (key: KeyEvent) => {
    const maxIndex = state.view === "collections"
      ? state.collections.length - 1
      : state.notes.length - 1

    // Navigation
    if (key.name === "down" || key.name === "j") {
      state.selectedIndex = Math.min(state.selectedIndex + 1, maxIndex)
      render()
    } else if (key.name === "up" || key.name === "k") {
      state.selectedIndex = Math.max(state.selectedIndex - 1, 0)
      render()
    }

    // Views
    else if (key.name === "l") {
      state.view = "list"
      state.filter = null
      await refresh()
      state.selectedIndex = 0
      state.message = "↑↓ navigate │ enter select │ 1-9 filter │ s swot │ q quit"
      render()
    } else if (key.name === "s") {
      state.view = "swot"
      const swotCollections = state.collections.filter(c => c.type === "swot")
      if (swotCollections.length > 0 && swotCollections[0]) {
        state.selectedCollection = swotCollections[0]
        state.swotNotes = await service.getCollectionNotes(swotCollections[0].id)
      }
      state.message = "viewing SWOT │ l list │ c collections │ q quit"
      render()
    } else if (key.name === "c") {
      state.view = "collections"
      state.selectedIndex = 0
      state.message = "↑↓ navigate │ enter view │ l list │ q quit"
      render()
    }

    // Select / drill in
    else if (key.name === "return" || key.name === "enter") {
      if (state.view === "list" && state.notes[state.selectedIndex]) {
        state.selectedNote = state.notes[state.selectedIndex]!
        state.linkedNotes = await service.getLinkedNotes(state.selectedNote.id)
        state.view = "detail"
        state.message = "viewing note │ x links │ l list │ q quit"
        render()
      } else if (state.view === "collections" && state.collections[state.selectedIndex]) {
        const col = state.collections[state.selectedIndex]!
        if (col.type === "swot") {
          state.selectedCollection = col
          state.swotNotes = await service.getCollectionNotes(col.id)
          state.view = "swot"
          state.message = "viewing SWOT │ l list │ q quit"
        }
        render()
      }
    }

    // Links view
    else if (key.name === "x" && state.selectedNote) {
      state.view = "links"
      state.message = "viewing links │ enter to select │ l list │ q quit"
      render()
    }

    // Filter by type (number keys)
    else if (state.view === "list" && ["1","2","3","4","5","6","7","8","9"].includes(key.name)) {
      const types: (service.NoteType | null)[] = [null, "note", "idea", "persona", "painpoint", "goal", "question", "swot_s", "swot_w"]
      state.filter = types[parseInt(key.name)] ?? null
      await refresh()
      state.selectedIndex = 0
      state.message = state.filter ? `filtered: ${state.filter}` : "showing all"
      render()
    }

    // Back
    else if (key.name === "escape" || key.name === "backspace") {
      if (state.view === "detail" || state.view === "links") {
        state.view = "list"
        state.selectedNote = null
        state.message = "↑↓ navigate │ enter select │ s swot │ c collections │ q quit"
        render()
      }
    }

    // Quit
    else if (key.name === "q") {
      renderer.stop()
      await closeDb()
      process.exit(0)
    }
  })

  renderer.start()
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
