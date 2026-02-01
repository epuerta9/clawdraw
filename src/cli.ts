#!/usr/bin/env bun
import { initSchema, getDb, closeDb } from "./db"
import * as service from "./service"
import * as render from "./render"
import * as retro from "./render-retro"

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  // Initialize DB
  await initSchema()

  switch (command) {
    // ═══════════════════════════════════════════════════════════════
    // RETRO 8-BIT VIEW COMMANDS (for Claude to display)
    // ═══════════════════════════════════════════════════════════════

    case "retro":
    case "r": {
      // Show retro dashboard with header + notes list
      const notes = await service.listNotes(undefined, 20)
      console.log(retro.renderRetroHeader("BIZCANVAS", `${notes.length} notes in database`))
      console.log()
      console.log(retro.renderRetroList(notes))
      break
    }

    case "retro-list":
    case "rl": {
      const type = args[1] as service.NoteType | undefined
      const notes = await service.listNotes(type, 20)
      const subtitle = type ? `filtered: ${type}` : `${notes.length} notes`
      console.log(retro.renderRetroHeader("BIZCANVAS", subtitle))
      console.log()
      console.log(retro.renderRetroList(notes))
      break
    }

    case "retro-show":
    case "rs": {
      const id = args[1]
      if (!id) {
        console.error("Usage: bizcanvas retro-show <id>")
        process.exit(1)
      }
      const notes = await service.listNotes(undefined, 100)
      const note = notes.find((n) => n.id.startsWith(id))
      if (!note) {
        console.error(`Note not found: ${id}`)
        process.exit(1)
      }
      console.log(retro.renderRetroHeader("BIZCANVAS", "note detail"))
      console.log()
      console.log(retro.renderRetroDetail(note))
      break
    }

    case "retro-links":
    case "rx": {
      const id = args[1]
      if (!id) {
        console.error("Usage: bizcanvas retro-links <id>")
        process.exit(1)
      }
      const notes = await service.listNotes(undefined, 100)
      const note = notes.find((n) => n.id.startsWith(id))
      if (!note) {
        console.error(`Note not found: ${id}`)
        process.exit(1)
      }
      const linked = await service.getLinkedNotes(note.id)
      console.log(retro.renderRetroHeader("BIZCANVAS", "connections"))
      console.log()
      console.log(retro.renderRetroLinks(note, linked))
      break
    }

    case "retro-swot":
    case "rw": {
      const collectionId = args[1]
      // If no ID, find first SWOT collection
      const collections = await service.listCollections("swot")
      let collection = collectionId
        ? collections.find((c) => c.id.startsWith(collectionId))
        : collections[0]

      if (!collection) {
        console.error(collectionId ? `SWOT not found: ${collectionId}` : "No SWOT collections found")
        process.exit(1)
      }
      const notes = await service.getCollectionNotes(collection.id)
      console.log(retro.renderRetroHeader("BIZCANVAS", "swot analysis"))
      console.log()
      console.log(retro.renderRetroSWOT(
        collection.name,
        notes.filter((n) => n.type === "swot_s"),
        notes.filter((n) => n.type === "swot_w"),
        notes.filter((n) => n.type === "swot_o"),
        notes.filter((n) => n.type === "swot_t")
      ))
      break
    }

    case "retro-collections":
    case "rc": {
      const collections = await service.listCollections()
      console.log(retro.renderRetroHeader("BIZCANVAS", `${collections.length} collections`))
      console.log()
      console.log(retro.renderRetroCollections(collections))
      break
    }

    // ═══════════════════════════════════════════════════════════════
    // PLAIN TEXT COMMANDS (original)
    // ═══════════════════════════════════════════════════════════════

    case "list":
    case "ls": {
      const type = args[1] as service.NoteType | undefined
      const notes = await service.listNotes(type)
      console.log(render.renderNoteList(notes))
      break
    }

    case "show": {
      const id = args[1]
      if (!id) {
        console.error("Usage: bizcanvas show <id>")
        process.exit(1)
      }
      // Try to find by partial ID
      const notes = await service.listNotes(undefined, 100)
      const note = notes.find((n) => n.id.startsWith(id))
      if (!note) {
        console.error(`Note not found: ${id}`)
        process.exit(1)
      }
      const tags = await service.getNoteTags(note.id)
      if (note.type === "persona") {
        console.log(render.renderPersona(note))
      } else {
        console.log(render.renderNote(note, tags.map((t) => t.name)))
      }
      break
    }

    case "links": {
      const id = args[1]
      if (!id) {
        console.error("Usage: bizcanvas links <id>")
        process.exit(1)
      }
      const notes = await service.listNotes(undefined, 100)
      const note = notes.find((n) => n.id.startsWith(id))
      if (!note) {
        console.error(`Note not found: ${id}`)
        process.exit(1)
      }
      const linked = await service.getLinkedNotes(note.id)
      console.log(render.renderLinks(note, linked))
      break
    }

    case "search": {
      const query = args.slice(1).join(" ")
      if (!query) {
        console.error("Usage: bizcanvas search <query>")
        process.exit(1)
      }
      const notes = await service.searchNotes(query)
      console.log(render.renderNoteList(notes))
      break
    }

    case "collections": {
      const collections = await service.listCollections()
      for (const c of collections) {
        const notes = await service.getCollectionNotes(c.id)
        console.log(render.renderCollection(c, notes))
      }
      break
    }

    case "swot": {
      const collectionId = args[1]
      if (!collectionId) {
        console.error("Usage: bizcanvas swot <collection-id>")
        process.exit(1)
      }
      const collections = await service.listCollections("swot")
      const collection = collections.find((c) => c.id.startsWith(collectionId))
      if (!collection) {
        console.error(`SWOT collection not found: ${collectionId}`)
        process.exit(1)
      }
      const notes = await service.getCollectionNotes(collection.id)
      console.log(render.renderSWOT(
        collection.name,
        notes.filter((n) => n.type === "swot_s"),
        notes.filter((n) => n.type === "swot_w"),
        notes.filter((n) => n.type === "swot_o"),
        notes.filter((n) => n.type === "swot_t")
      ))
      break
    }

    case "tag": {
      const tagName = args[1]
      if (!tagName) {
        console.error("Usage: bizcanvas tag <tagname>")
        process.exit(1)
      }
      const notes = await service.getNotesByTag(tagName)
      console.log(`\nNotes tagged #${tagName}:\n`)
      console.log(render.renderNoteList(notes))
      break
    }

    case "export": {
      // Export all data as JSON
      const notes = await service.listNotes(undefined, 1000)
      const collections = await service.listCollections()
      const data = { notes, collections }
      console.log(JSON.stringify(data, null, 2))
      break
    }

    case "help":
    default:
      console.log(`
bizcanvas - Business canvas CLI

═══ RETRO 8-BIT VIEW (recommended) ═══
  retro, r              Dashboard with notes list
  retro-list, rl [type] List notes with retro styling
  retro-show, rs <id>   Show note detail
  retro-links, rx <id>  Show connections graph
  retro-swot, rw [id]   Show SWOT analysis
  retro-collections, rc List collections

═══ PLAIN TEXT ═══
  list [type]        List notes
  show <id>          Show a note
  links <id>         Show linked notes
  search <query>     Search notes
  collections        List all collections
  swot <id>          Render SWOT analysis
  tag <name>         Show notes with tag
  export             Export all data as JSON

Note types: note, idea, persona, painpoint, goal, question, swot_s, swot_w, swot_o, swot_t

Use /bizcanvas skill in Claude Code to create and manage notes conversationally.
`)
  }

  await closeDb()
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
