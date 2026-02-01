// Retro 8-bit ASCII renderers for CLI output (same style as OpenTUI viewer)
import type { Note, Collection, Link } from "./service"

// ANSI color codes for 8-bit retro look
const C = {
  reset: "\x1b[0m",
  bg: "\x1b[48;2;15;15;35m",       // dark blue-black
  bgAlt: "\x1b[48;2;26;26;46m",    // slightly lighter
  title: "\x1b[38;2;255;204;0m",   // gold
  text: "\x1b[38;2;204;204;204m",  // light gray
  textDim: "\x1b[38;2;102;102;128m", // dim purple-gray
  accent: "\x1b[38;2;0;255;65m",   // matrix green
  accent2: "\x1b[38;2;255;107;107m", // coral red
  accent3: "\x1b[38;2;78;205;196m",  // teal
  highlight: "\x1b[38;2;255;215;0m", // yellow
  strength: "\x1b[38;2;0;255;65m",   // green
  weakness: "\x1b[38;2;255;107;107m", // red
  opportunity: "\x1b[38;2;78;205;196m", // teal
  threat: "\x1b[38;2;255;140;0m",   // orange
}

const ICONS: Record<string, string> = {
  note: "■",
  idea: "◆",
  persona: "●",
  painpoint: "▲",
  goal: "★",
  question: "?",
  swot_s: "▲",
  swot_w: "▼",
  swot_o: "►",
  swot_t: "◄",
}

export function renderRetroHeader(title: string, subtitle?: string): string {
  const lines: string[] = []
  lines.push(`${C.bgAlt}${C.title}╔${"═".repeat(50)}╗${C.reset}`)
  lines.push(`${C.bgAlt}${C.title}║  ╔══ ${title.toUpperCase().slice(0, 38).padEnd(38)} ══╗  ║${C.reset}`)
  if (subtitle) {
    lines.push(`${C.bgAlt}${C.textDim}║  ${subtitle.slice(0, 46).padEnd(46)}  ║${C.reset}`)
  }
  lines.push(`${C.bgAlt}${C.title}╚${"═".repeat(50)}╝${C.reset}`)
  return lines.join("\n")
}

export function renderRetroList(notes: Note[], selectedIndex = -1): string {
  const lines: string[] = []

  lines.push(`${C.bg}${C.title}┌─ NOTES ${"─".repeat(41)}┐${C.reset}`)

  if (notes.length === 0) {
    lines.push(`${C.bg}${C.textDim}│ (no notes yet)${" ".repeat(33)}│${C.reset}`)
  } else {
    for (let i = 0; i < Math.min(notes.length, 20); i++) {
      const note = notes[i]!
      const icon = ICONS[note.type] ?? "□"
      const selected = i === selectedIndex
      const color = selected ? C.highlight : C.text
      const prefix = selected ? "►" : " "
      const title = note.title.slice(0, 40).padEnd(40)
      lines.push(`${C.bg}${color}│${prefix}${icon} ${title} │${C.reset}`)
    }
    if (notes.length > 20) {
      lines.push(`${C.bg}${C.textDim}│ ... and ${notes.length - 20} more${" ".repeat(28)}│${C.reset}`)
    }
  }

  lines.push(`${C.bg}${C.title}└${"─".repeat(49)}┘${C.reset}`)
  return lines.join("\n")
}

export function renderRetroDetail(note: Note): string {
  const lines: string[] = []
  const icon = ICONS[note.type] ?? "□"
  const meta = note.metadata as Record<string, unknown> | undefined

  lines.push(`${C.bg}${C.title}╔${"═".repeat(52)}╗${C.reset}`)
  lines.push(`${C.bg}${C.highlight}║ ${icon} ${note.title.slice(0, 48).padEnd(48)} ║${C.reset}`)
  lines.push(`${C.bg}${C.title}╠${"═".repeat(52)}╣${C.reset}`)

  lines.push(`${C.bg}${C.textDim}║ Type: ${note.type.padEnd(44)} ║${C.reset}`)
  lines.push(`${C.bg}${C.textDim}║ ID: ${note.id.slice(0, 8).padEnd(46)} ║${C.reset}`)

  if (note.content) {
    lines.push(`${C.bg}${C.title}╠${"─".repeat(52)}╣${C.reset}`)
    const contentLines = note.content.slice(0, 300).split("\n").slice(0, 6)
    for (const line of contentLines) {
      lines.push(`${C.bg}${C.text}║ ${line.slice(0, 50).padEnd(50)} ║${C.reset}`)
    }
  }

  // Persona specific fields
  if (meta && note.type === "persona") {
    const goals = meta.goals as string[] | undefined
    const painPoints = meta.painPoints as string[] | undefined
    const quote = meta.quote as string | undefined

    if (quote) {
      lines.push(`${C.bg}${C.title}╠${"─".repeat(52)}╣${C.reset}`)
      lines.push(`${C.bg}${C.textDim}║ "${quote.slice(0, 48).padEnd(48)}" ║${C.reset}`)
    }

    if (goals && goals.length > 0) {
      lines.push(`${C.bg}${C.title}╠${"─".repeat(52)}╣${C.reset}`)
      lines.push(`${C.bg}${C.accent}║ ★ GOALS${" ".repeat(44)}║${C.reset}`)
      for (const g of goals.slice(0, 4)) {
        lines.push(`${C.bg}${C.accent}║   • ${String(g).slice(0, 45).padEnd(45)} ║${C.reset}`)
      }
    }

    if (painPoints && painPoints.length > 0) {
      lines.push(`${C.bg}${C.title}╠${"─".repeat(52)}╣${C.reset}`)
      lines.push(`${C.bg}${C.accent2}║ ▲ PAIN POINTS${" ".repeat(38)}║${C.reset}`)
      for (const p of painPoints.slice(0, 4)) {
        lines.push(`${C.bg}${C.accent2}║   • ${String(p).slice(0, 45).padEnd(45)} ║${C.reset}`)
      }
    }
  }

  lines.push(`${C.bg}${C.title}╚${"═".repeat(52)}╝${C.reset}`)
  return lines.join("\n")
}

export function renderRetroLinks(
  note: Note,
  linkedNotes: { note: Note; link: Link; direction: "outgoing" | "incoming" }[]
): string {
  const lines: string[] = []
  const incoming = linkedNotes.filter(l => l.direction === "incoming")
  const outgoing = linkedNotes.filter(l => l.direction === "outgoing")

  lines.push(`${C.bg}${C.title}┌─ CONNECTIONS ${"─".repeat(35)}┐${C.reset}`)

  // Incoming
  if (incoming.length > 0) {
    lines.push(`${C.bg}${C.textDim}│ INCOMING:${" ".repeat(39)}│${C.reset}`)
    for (const { note: n, link } of incoming.slice(0, 5)) {
      const icon = ICONS[n.type] ?? "□"
      const label = link.label ?? "→"
      lines.push(`${C.bg}${C.accent3}│   ${icon} ${n.title.slice(0, 25)} ──[${label.slice(0,8)}]──► │${C.reset}`)
    }
  }

  // Center node
  lines.push(`${C.bg}${C.title}├${"─".repeat(49)}┤${C.reset}`)
  lines.push(`${C.bg}${C.highlight}│     ╔═══ ${note.title.slice(0, 28).padEnd(28)} ═══╗     │${C.reset}`)
  lines.push(`${C.bg}${C.title}├${"─".repeat(49)}┤${C.reset}`)

  // Outgoing
  if (outgoing.length > 0) {
    lines.push(`${C.bg}${C.textDim}│ OUTGOING:${" ".repeat(39)}│${C.reset}`)
    for (const { note: n, link } of outgoing.slice(0, 5)) {
      const icon = ICONS[n.type] ?? "□"
      const label = link.label ?? "→"
      lines.push(`${C.bg}${C.accent}│   ──[${label.slice(0,8)}]──► ${icon} ${n.title.slice(0, 25).padEnd(25)} │${C.reset}`)
    }
  }

  if (linkedNotes.length === 0) {
    lines.push(`${C.bg}${C.textDim}│ (no connections)${" ".repeat(32)}│${C.reset}`)
  }

  lines.push(`${C.bg}${C.title}└${"─".repeat(49)}┘${C.reset}`)
  return lines.join("\n")
}

export function renderRetroSWOT(
  name: string,
  strengths: Note[],
  weaknesses: Note[],
  opportunities: Note[],
  threats: Note[]
): string {
  const lines: string[] = []
  const w = 24 // quadrant width

  lines.push(`${C.bg}${C.title}╔══ SWOT: ${name.slice(0, 38).padEnd(38)} ══╗${C.reset}`)
  lines.push(`${C.bg}${C.title}╠${"═".repeat(w)}╦${"═".repeat(w)}╣${C.reset}`)

  // Strengths | Weaknesses header
  lines.push(`${C.bg}${C.strength}║ ▲ STRENGTHS${" ".repeat(w-13)}${C.title}║${C.weakness} ▼ WEAKNESSES${" ".repeat(w-14)}║${C.reset}`)

  const maxItems = 5
  for (let i = 0; i < maxItems; i++) {
    const s = strengths[i]
    const wk = weaknesses[i]
    const sText = s ? `• ${s.title.slice(0, w-4)}` : ""
    const wText = wk ? `• ${wk.title.slice(0, w-4)}` : ""
    lines.push(`${C.bg}${C.text}║ ${sText.padEnd(w-2)}${C.title}║${C.text} ${wText.padEnd(w-2)}║${C.reset}`)
  }

  lines.push(`${C.bg}${C.title}╠${"═".repeat(w)}╬${"═".repeat(w)}╣${C.reset}`)

  // Opportunities | Threats header
  lines.push(`${C.bg}${C.opportunity}║ ► OPPORTUNITIES${" ".repeat(w-17)}${C.title}║${C.threat} ◄ THREATS${" ".repeat(w-11)}║${C.reset}`)

  for (let i = 0; i < maxItems; i++) {
    const o = opportunities[i]
    const t = threats[i]
    const oText = o ? `• ${o.title.slice(0, w-4)}` : ""
    const tText = t ? `• ${t.title.slice(0, w-4)}` : ""
    lines.push(`${C.bg}${C.text}║ ${oText.padEnd(w-2)}${C.title}║${C.text} ${tText.padEnd(w-2)}║${C.reset}`)
  }

  lines.push(`${C.bg}${C.title}╚${"═".repeat(w)}╩${"═".repeat(w)}╝${C.reset}`)
  return lines.join("\n")
}

export function renderRetroCollections(collections: Collection[]): string {
  const lines: string[] = []

  lines.push(`${C.bg}${C.title}┌─ COLLECTIONS ${"─".repeat(35)}┐${C.reset}`)

  if (collections.length === 0) {
    lines.push(`${C.bg}${C.textDim}│ (no collections)${" ".repeat(32)}│${C.reset}`)
  } else {
    for (const col of collections.slice(0, 15)) {
      const typeIcon = col.type === "swot" ? "◈" : col.type === "mindmap" ? "◉" : "□"
      const name = col.name.slice(0, 32).padEnd(32)
      lines.push(`${C.bg}${C.text}│ ${typeIcon} ${name} [${col.type.padEnd(8)}] │${C.reset}`)
    }
  }

  lines.push(`${C.bg}${C.title}└${"─".repeat(49)}┘${C.reset}`)
  return lines.join("\n")
}
