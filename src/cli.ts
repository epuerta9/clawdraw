#!/usr/bin/env bun
import { initSchema, getDb, closeDb } from "./db"
import * as service from "./service"
import * as render from "./render"

const args = process.argv.slice(2)
const command = args[0]

async function main() {
  // Initialize DB
  await initSchema()

  switch (command) {
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

Commands:
  list [type]        List notes (optionally filter by type)
  show <id>          Show a note
  links <id>         Show linked notes
  search <query>     Search notes
  collections        List all collections
  swot <id>          Render SWOT analysis
  tag <name>         Show notes with tag
  export             Export all data as JSON
  help               Show this help

Note types: note, idea, persona, painpoint, goal, question, swot_s, swot_w, swot_o, swot_t

This CLI is for viewing data. Use the Claude Code /bizcanvas skill
to create and manage notes conversationally.
`)
  }

  await closeDb()
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
