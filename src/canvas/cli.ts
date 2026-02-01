#!/usr/bin/env bun
// Canvas CLI - commands for Claude to drive the canvas
import { initSchema } from "../db"
import { initCanvasSchema, createCanvas, getCanvas, listCanvases, addNoteToCanvas, autoPlaceNotes, deleteCanvas } from "./service"
import { TEMPLATES, getTemplate } from "./types"
import * as noteService from "../service"

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

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  await loadEnv()
  await initSchema()
  await initCanvasSchema()

  switch (command) {
    case "templates": {
      console.log("\n╔══ AVAILABLE TEMPLATES ══╗\n")
      for (const t of TEMPLATES) {
        console.log(`  ${t.icon} ${t.id.padEnd(12)} - ${t.name}`)
        console.log(`    ${t.description}`)
        if (t.zones.length > 0) {
          console.log(`    Zones: ${t.zones.map(z => z.label).join(", ")}`)
        }
        console.log()
      }
      break
    }

    case "create": {
      const templateId = args[1]
      const name = args.slice(2).join(" ") || `New ${templateId}`

      if (!templateId) {
        console.error("Usage: canvas create <template-id> [name]")
        console.error("Templates: " + TEMPLATES.map(t => t.id).join(", "))
        process.exit(1)
      }

      const template = getTemplate(templateId)
      if (!template) {
        console.error(`Template not found: ${templateId}`)
        console.error("Available: " + TEMPLATES.map(t => t.id).join(", "))
        process.exit(1)
      }

      const canvas = await createCanvas(name, templateId)
      console.log(`\n✓ Created canvas: ${canvas.name}`)
      console.log(`  ID: ${canvas.id}`)
      console.log(`  Template: ${template.name}`)
      console.log(`\nView with: bun run canvas:live ${canvas.id}`)
      break
    }

    case "list": {
      const canvases = await listCanvases()
      console.log("\n╔══ CANVASES ══╗\n")

      if (canvases.length === 0) {
        console.log("  (no canvases yet)")
        console.log("  Create one: bun run canvas create <template-id> [name]")
      }

      for (const c of canvases) {
        const tmpl = getTemplate(c.templateId)
        console.log(`  ${tmpl?.icon ?? "□"} ${c.id.slice(0, 8)} - ${c.name} [${c.templateId}]`)
      }
      console.log()
      break
    }

    case "show": {
      const canvasId = args[1]
      if (!canvasId) {
        console.error("Usage: canvas show <canvas-id>")
        process.exit(1)
      }

      const canvases = await listCanvases()
      const match = canvases.find(c => c.id.startsWith(canvasId))
      if (!match) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      const canvas = await getCanvas(match.id)
      if (!canvas) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      const template = getTemplate(canvas.templateId)
      console.log(`\n╔══ ${canvas.name.toUpperCase()} ══╗`)
      console.log(`  ID: ${canvas.id}`)
      console.log(`  Template: ${template?.name ?? canvas.templateId}`)
      console.log(`  Nodes: ${canvas.nodes.length}`)
      console.log(`  Viewport: x=${canvas.viewport.x} y=${canvas.viewport.y} zoom=${canvas.viewport.zoom}`)

      if (canvas.nodes.length > 0) {
        const notes = await noteService.listNotes(undefined, 1000)
        const noteMap = new Map(notes.map(n => [n.id, n]))

        console.log("\n  Nodes:")
        for (const node of canvas.nodes) {
          const note = noteMap.get(node.noteId)
          const zoneName = node.zoneId ? ` [${node.zoneId}]` : ""
          console.log(`    • ${note?.title ?? node.noteId}${zoneName} at (${node.position.x}, ${node.position.y})`)
        }
      }
      console.log()
      break
    }

    case "view": {
      // Render canvas as retro ASCII art
      const canvasId = args[1]
      if (!canvasId) {
        console.error("Usage: canvas view <canvas-id>")
        process.exit(1)
      }

      const canvases = await listCanvases()
      const match = canvases.find(c => c.id.startsWith(canvasId))
      if (!match) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      const canvas = await getCanvas(match.id)
      if (!canvas) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      const template = getTemplate(canvas.templateId)
      const notes = await noteService.listNotes(undefined, 1000)
      const noteMap = new Map(notes.map(n => [n.id, n]))

      // Retro colors
      const C = {
        reset: "\x1b[0m",
        bg: "\x1b[48;2;15;15;35m",
        gold: "\x1b[38;2;255;204;0m",
        green: "\x1b[38;2;0;255;65m",
        red: "\x1b[38;2;255;107;107m",
        cyan: "\x1b[38;2;78;205;196m",
        yellow: "\x1b[38;2;255;230;109m",
        pink: "\x1b[38;2;243;129;129m",
        purple: "\x1b[38;2;170;150;218m",
        dim: "\x1b[38;2;102;102;128m",
      }

      console.log(`\n${C.bg}${C.gold}╔${"═".repeat(58)}╗${C.reset}`)
      console.log(`${C.bg}${C.gold}║  ${template?.icon ?? "□"} ${canvas.name.toUpperCase().padEnd(53)}║${C.reset}`)
      console.log(`${C.bg}${C.gold}║  ${C.dim}Template: ${canvas.templateId.padEnd(44)}${C.gold}║${C.reset}`)
      console.log(`${C.bg}${C.gold}╠${"═".repeat(58)}╣${C.reset}`)

      // Group nodes by zone
      const byZone = new Map<string, typeof canvas.nodes>()
      for (const node of canvas.nodes) {
        const zone = node.zoneId || "unassigned"
        if (!byZone.has(zone)) byZone.set(zone, [])
        byZone.get(zone)!.push(node)
      }

      // Render zones
      if (template?.zones) {
        for (const zone of template.zones) {
          // Match by zone.id, zone.name, or the node's zoneId
          const zoneNodes = byZone.get(zone.id) || byZone.get(zone.name) || []
          console.log(`${C.bg}${C.gold}║ ${C.cyan}${zone.icon ?? "■"} ${zone.label.padEnd(54)}${C.gold}║${C.reset}`)
          console.log(`${C.bg}${C.gold}║  ${C.dim}${"─".repeat(55)}${C.gold}║${C.reset}`)

          if (zoneNodes.length === 0) {
            console.log(`${C.bg}${C.gold}║    ${C.dim}(empty)${" ".repeat(49)}${C.gold}║${C.reset}`)
          } else {
            for (const node of zoneNodes) {
              const note = noteMap.get(node.noteId)
              const title = (note?.title || node.noteId).slice(0, 48)
              console.log(`${C.bg}${C.gold}║    ${C.green}• ${title.padEnd(51)}${C.gold}║${C.reset}`)
            }
          }
          console.log(`${C.bg}${C.gold}║${" ".repeat(58)}║${C.reset}`)
        }
      }

      // Unassigned nodes
      const unassigned = byZone.get("unassigned") || []
      if (unassigned.length > 0) {
        console.log(`${C.bg}${C.gold}║ ${C.purple}◆ Unassigned${" ".repeat(45)}${C.gold}║${C.reset}`)
        for (const node of unassigned) {
          const note = noteMap.get(node.noteId)
          const title = (note?.title || node.noteId).slice(0, 48)
          console.log(`${C.bg}${C.gold}║    ${C.yellow}• ${title.padEnd(51)}${C.gold}║${C.reset}`)
        }
      }

      console.log(`${C.bg}${C.gold}╚${"═".repeat(58)}╝${C.reset}\n`)
      break
    }

    case "quick": {
      // Quick add: create note + add to canvas in one command
      // Usage: canvas quick <canvas-id> <zone> "content"
      const canvasId = args[1]
      const zoneId = args[2]
      const content = args.slice(3).join(" ")

      if (!canvasId || !zoneId || !content) {
        console.error("Usage: canvas quick <canvas-id> <zone> \"content\"")
        console.error("Example: canvas quick abc123 strengths \"Strong engineering team\"")
        process.exit(1)
      }

      // Find canvas
      const canvases = await listCanvases()
      const canvasMatch = canvases.find(c => c.id.startsWith(canvasId))
      if (!canvasMatch) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      // Determine note type based on zone
      let noteType: noteService.NoteType = "idea"
      if (zoneId === "strengths") noteType = "swot_s"
      else if (zoneId === "weaknesses") noteType = "swot_w"
      else if (zoneId === "opportunities") noteType = "swot_o"
      else if (zoneId === "threats") noteType = "swot_t"
      else if (zoneId.includes("pain")) noteType = "pain_point"
      else if (zoneId.includes("persona")) noteType = "persona"

      // Create note (positional args: type, title, content, metadata)
      const note = await noteService.createNote(
        noteType,
        content.slice(0, 100),
        content,
        undefined
      )

      // Add to canvas
      const node = await addNoteToCanvas(canvasMatch.id, note.id, undefined, zoneId)
      console.log(`✓ Added "${note.title}" to ${zoneId}`)
      break
    }

    case "add": {
      const canvasId = args[1]
      const noteId = args[2]
      const zoneId = args[3]

      if (!canvasId || !noteId) {
        console.error("Usage: canvas add <canvas-id> <note-id> [zone-id]")
        process.exit(1)
      }

      // Find canvas
      const canvases = await listCanvases()
      const canvasMatch = canvases.find(c => c.id.startsWith(canvasId))
      if (!canvasMatch) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      // Find note
      const notes = await noteService.listNotes(undefined, 1000)
      const noteMatch = notes.find(n => n.id.startsWith(noteId))
      if (!noteMatch) {
        console.error(`Note not found: ${noteId}`)
        process.exit(1)
      }

      const node = await addNoteToCanvas(canvasMatch.id, noteMatch.id, undefined, zoneId)
      console.log(`✓ Added "${noteMatch.title}" to canvas at (${node.position.x.toFixed(0)}, ${node.position.y.toFixed(0)})`)
      break
    }

    case "auto-place": {
      const canvasId = args[1]
      const noteType = args[2] as noteService.NoteType | undefined

      if (!canvasId) {
        console.error("Usage: canvas auto-place <canvas-id> [note-type]")
        process.exit(1)
      }

      // Find canvas
      const canvases = await listCanvases()
      const canvasMatch = canvases.find(c => c.id.startsWith(canvasId))
      if (!canvasMatch) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      // Get notes to place
      const notes = await noteService.listNotes(noteType, 100)
      const noteIds = notes.map(n => n.id)

      await autoPlaceNotes(canvasMatch.id, noteIds)
      console.log(`✓ Auto-placed ${noteIds.length} notes on canvas`)
      break
    }

    case "populate-swot": {
      // Helper to populate a SWOT canvas from a collection
      const canvasId = args[1]
      const collectionId = args[2]

      if (!canvasId) {
        console.error("Usage: canvas populate-swot <canvas-id> [collection-id]")
        process.exit(1)
      }

      // Find canvas
      const canvases = await listCanvases()
      const canvasMatch = canvases.find(c => c.id.startsWith(canvasId))
      if (!canvasMatch) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      // Get SWOT notes
      let notes: noteService.Note[]
      if (collectionId) {
        const collections = await noteService.listCollections("swot")
        const col = collections.find(c => c.id.startsWith(collectionId))
        if (!col) {
          console.error(`Collection not found: ${collectionId}`)
          process.exit(1)
        }
        notes = await noteService.getCollectionNotes(col.id)
      } else {
        // Get all SWOT notes
        const s = await noteService.listNotes("swot_s", 50)
        const w = await noteService.listNotes("swot_w", 50)
        const o = await noteService.listNotes("swot_o", 50)
        const t = await noteService.listNotes("swot_t", 50)
        notes = [...s, ...w, ...o, ...t]
      }

      await autoPlaceNotes(canvasMatch.id, notes.map(n => n.id))
      console.log(`✓ Populated SWOT canvas with ${notes.length} items`)
      break
    }

    case "delete": {
      const canvasId = args[1]
      if (!canvasId) {
        console.error("Usage: canvas delete <canvas-id>")
        process.exit(1)
      }

      const canvases = await listCanvases()
      const match = canvases.find(c => c.id.startsWith(canvasId))
      if (!match) {
        console.error(`Canvas not found: ${canvasId}`)
        process.exit(1)
      }

      await deleteCanvas(match.id)
      console.log(`✓ Deleted canvas: ${match.name}`)
      break
    }

    case "help":
    default:
      console.log(`
bizcanvas canvas - Infinite canvas management

═══ TEMPLATES ═══
  templates              List all available templates

═══ CANVAS CRUD ═══
  create <template> [name]    Create new canvas from template
  list                        List all canvases
  show <canvas-id>            Show canvas details
  view <canvas-id>            Render canvas as retro ASCII
  delete <canvas-id>          Delete a canvas

═══ NODES ═══
  quick <id> <zone> "text"         Quick add: create + place in one
  add <canvas-id> <note-id> [zone] Add existing note to canvas
  auto-place <canvas-id> [type]    Auto-place notes by type
  populate-swot <canvas-id> [col]  Populate SWOT from collection

═══ EXAMPLES ═══
  canvas create swot "Q1 Strategy"
  canvas quick abc strengths "Fast team"
  canvas view abc

═══ LIVE VIEWER ═══
  bun run canvas:live [canvas-id]

═══ COLLABORATION ═══
  bun run collab <room-id> --name "Claude-1"

Templates: ${TEMPLATES.map(t => t.id).join(", ")}
`)
  }
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
