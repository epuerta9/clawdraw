import type { Note, Link, Collection } from "./service"

// ASCII box drawing
function boxText(title: string, content: string[], width = 60): string {
  const lines: string[] = []
  const innerWidth = width - 4

  lines.push("┌" + "─".repeat(width - 2) + "┐")
  lines.push("│ " + title.slice(0, innerWidth).padEnd(innerWidth) + " │")
  lines.push("├" + "─".repeat(width - 2) + "┤")

  for (const line of content) {
    const wrapped = wrapText(line, innerWidth)
    for (const w of wrapped) {
      lines.push("│ " + w.padEnd(innerWidth) + " │")
    }
  }

  lines.push("└" + "─".repeat(width - 2) + "┘")
  return lines.join("\n")
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    if ((current + " " + word).trim().length > width) {
      if (current) lines.push(current)
      current = word
    } else {
      current = (current + " " + word).trim()
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

// Render a single note
export function renderNote(note: Note, tags?: string[]): string {
  const icon = getNoteIcon(note.type)
  const lines: string[] = []

  if (note.content) {
    lines.push(note.content)
  }
  if (tags && tags.length > 0) {
    lines.push("")
    lines.push("Tags: " + tags.map((t) => `#${t}`).join(" "))
  }
  lines.push("")
  lines.push(`ID: ${note.id.slice(0, 8)}  Type: ${note.type}`)

  return boxText(`${icon} ${note.title}`, lines)
}

// Render a list of notes
export function renderNoteList(notes: Note[]): string {
  if (notes.length === 0) {
    return "No notes found."
  }

  const lines: string[] = []
  lines.push("┌────────────────────────────────────────────────────────────┐")
  lines.push("│  Notes                                                     │")
  lines.push("├────────┬─────────────┬───────────────────────────────────────┤")
  lines.push("│ Type   │ ID          │ Title                                 │")
  lines.push("├────────┼─────────────┼───────────────────────────────────────┤")

  for (const note of notes) {
    const icon = getNoteIcon(note.type)
    const id = note.id.slice(0, 8)
    const title = note.title.slice(0, 35).padEnd(35)
    lines.push(`│ ${icon.padEnd(6)} │ ${id}... │ ${title} │`)
  }

  lines.push("└────────┴─────────────┴───────────────────────────────────────┘")
  return lines.join("\n")
}

// Render linked notes as a graph
export function renderLinks(
  centerNote: Note,
  links: { note: Note; link: Link; direction: "outgoing" | "incoming" }[]
): string {
  const lines: string[] = []
  const icon = getNoteIcon(centerNote.type)

  lines.push("")
  lines.push("                    Connections")
  lines.push("")

  // Incoming links
  const incoming = links.filter((l) => l.direction === "incoming")
  for (const { note, link } of incoming) {
    const noteIcon = getNoteIcon(note.type)
    const label = link.label ? ` [${link.label}]` : ""
    lines.push(`    ${noteIcon} ${note.title.slice(0, 25)}`)
    lines.push(`        │${label}`)
    lines.push(`        ▼`)
  }

  // Center note
  lines.push(`    ╔════════════════════════════════╗`)
  lines.push(`    ║ ${icon} ${centerNote.title.slice(0, 26).padEnd(26)} ║`)
  lines.push(`    ╚════════════════════════════════╝`)

  // Outgoing links
  const outgoing = links.filter((l) => l.direction === "outgoing")
  for (const { note, link } of outgoing) {
    const noteIcon = getNoteIcon(note.type)
    const label = link.label ? ` [${link.label}]` : ""
    lines.push(`        │${label}`)
    lines.push(`        ▼`)
    lines.push(`    ${noteIcon} ${note.title.slice(0, 25)}`)
  }

  if (links.length === 0) {
    lines.push("")
    lines.push("    No connections yet.")
  }

  lines.push("")
  return lines.join("\n")
}

// Render SWOT analysis
export function renderSWOT(
  title: string,
  strengths: Note[],
  weaknesses: Note[],
  opportunities: Note[],
  threats: Note[]
): string {
  const width = 35
  const lines: string[] = []

  lines.push(`\n  📊 SWOT Analysis: ${title}\n`)
  lines.push("  ┌" + "─".repeat(width) + "┬" + "─".repeat(width) + "┐")
  lines.push("  │" + " 💪 STRENGTHS".padEnd(width) + "│" + " ⚠️  WEAKNESSES".padEnd(width) + "│")
  lines.push("  │" + " (Internal +)".padEnd(width) + "│" + " (Internal -)".padEnd(width) + "│")
  lines.push("  ├" + "─".repeat(width) + "┼" + "─".repeat(width) + "┤")

  const maxRows = Math.max(strengths.length, weaknesses.length, opportunities.length, threats.length, 3)

  for (let i = 0; i < maxRows; i++) {
    const s = strengths[i]?.title.slice(0, width - 4) ?? ""
    const w = weaknesses[i]?.title.slice(0, width - 4) ?? ""
    lines.push("  │ • " + s.padEnd(width - 3) + "│ • " + w.padEnd(width - 3) + "│")
  }

  lines.push("  ├" + "─".repeat(width) + "┼" + "─".repeat(width) + "┤")
  lines.push("  │" + " 🚀 OPPORTUNITIES".padEnd(width) + "│" + " ⛔ THREATS".padEnd(width) + "│")
  lines.push("  │" + " (External +)".padEnd(width) + "│" + " (External -)".padEnd(width) + "│")
  lines.push("  ├" + "─".repeat(width) + "┼" + "─".repeat(width) + "┤")

  for (let i = 0; i < maxRows; i++) {
    const o = opportunities[i]?.title.slice(0, width - 4) ?? ""
    const t = threats[i]?.title.slice(0, width - 4) ?? ""
    lines.push("  │ • " + o.padEnd(width - 3) + "│ • " + t.padEnd(width - 3) + "│")
  }

  lines.push("  └" + "─".repeat(width) + "┴" + "─".repeat(width) + "┘")
  return lines.join("\n")
}

// Render persona
export function renderPersona(note: Note): string {
  const meta = (note.metadata ?? {}) as {
    role?: string
    goals?: string[]
    painPoints?: string[]
    demographics?: Record<string, string>
    quote?: string
  }

  const lines: string[] = []
  lines.push("")
  lines.push("  ╔════════════════════════════════════════════════════════╗")
  lines.push(`  ║  👤 ${note.title.slice(0, 50).padEnd(50)} ║`)
  if (meta.role) {
    lines.push(`  ║     ${meta.role.slice(0, 50).padEnd(50)} ║`)
  }
  lines.push("  ╠════════════════════════════════════════════════════════╣")

  if (meta.quote) {
    lines.push(`  ║  "${meta.quote.slice(0, 52)}"  ║`)
    lines.push("  ╠════════════════════════════════════════════════════════╣")
  }

  if (meta.demographics) {
    lines.push("  ║  DEMOGRAPHICS                                          ║")
    for (const [key, value] of Object.entries(meta.demographics)) {
      lines.push(`  ║    ${key}: ${String(value).slice(0, 45).padEnd(45)} ║`)
    }
  }

  if (meta.goals && meta.goals.length > 0) {
    lines.push("  ╠════════════════════════════════════════════════════════╣")
    lines.push("  ║  🎯 GOALS                                               ║")
    for (const goal of meta.goals.slice(0, 5)) {
      lines.push(`  ║    • ${goal.slice(0, 48).padEnd(48)} ║`)
    }
  }

  if (meta.painPoints && meta.painPoints.length > 0) {
    lines.push("  ╠════════════════════════════════════════════════════════╣")
    lines.push("  ║  🔥 PAIN POINTS                                         ║")
    for (const pain of meta.painPoints.slice(0, 5)) {
      lines.push(`  ║    • ${pain.slice(0, 48).padEnd(48)} ║`)
    }
  }

  if (note.content) {
    lines.push("  ╠════════════════════════════════════════════════════════╣")
    const wrapped = wrapText(note.content, 52)
    for (const line of wrapped.slice(0, 5)) {
      lines.push(`  ║  ${line.padEnd(52)} ║`)
    }
  }

  lines.push("  ╚════════════════════════════════════════════════════════╝")
  lines.push(`  ID: ${note.id.slice(0, 8)}`)
  lines.push("")

  return lines.join("\n")
}

// Render mindmap as tree
export function renderMindmap(root: Note, children: { note: Note; depth: number }[]): string {
  const lines: string[] = []
  const icon = getNoteIcon(root.type)

  lines.push("")
  lines.push(`  🧠 Mind Map`)
  lines.push("")
  lines.push(`  ${icon} ${root.title}`)

  for (let i = 0; i < children.length; i++) {
    const { note, depth } = children[i]!
    const childIcon = getNoteIcon(note.type)
    const indent = "  " + "    ".repeat(depth)
    const connector = i === children.length - 1 ? "└── " : "├── "
    lines.push(`${indent}${connector}${childIcon} ${note.title}`)
  }

  lines.push("")
  return lines.join("\n")
}

// Get icon for note type
function getNoteIcon(type: string): string {
  const icons: Record<string, string> = {
    note: "📝",
    idea: "💡",
    persona: "👤",
    painpoint: "🔥",
    goal: "🎯",
    question: "❓",
    swot_s: "💪",
    swot_w: "⚠️",
    swot_o: "🚀",
    swot_t: "⛔",
  }
  return icons[type] ?? "📌"
}

// Render collection
export function renderCollection(collection: Collection, notes: Note[]): string {
  const lines: string[] = []
  const typeIcon: Record<string, string> = {
    canvas: "🎨",
    mindmap: "🧠",
    swot: "📊",
    persona_set: "👥",
    project: "📁",
  }

  lines.push("")
  lines.push(boxText(
    `${typeIcon[collection.type] ?? "📁"} ${collection.name}`,
    [
      collection.description ?? "",
      "",
      `Type: ${collection.type}  |  ${notes.length} notes`,
      `ID: ${collection.id.slice(0, 8)}`,
      "",
      "Contents:",
      ...notes.map((n) => `  ${getNoteIcon(n.type)} ${n.title}`),
    ]
  ))

  return lines.join("\n")
}
