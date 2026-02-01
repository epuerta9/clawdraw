import type { ViewerState } from "./index"
import type { Note } from "../service"

// 8-bit color palette
const C = {
  bg: "#0f0f23",       // dark blue-black
  bgAlt: "#1a1a2e",    // slightly lighter
  border: "#3d3d5c",   // muted purple-gray
  title: "#ffcc00",    // gold
  text: "#cccccc",     // light gray
  textDim: "#666680",  // dim purple-gray
  accent: "#00ff41",   // matrix green
  accent2: "#ff6b6b",  // coral red
  accent3: "#4ecdc4",  // teal
  highlight: "#ffd700", // yellow highlight
  strength: "#00ff41",
  weakness: "#ff6b6b",
  opportunity: "#4ecdc4",
  threat: "#ff8c00",
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

interface AppProps {
  state: ViewerState
}

export function App({ state }: AppProps) {
  return (
    <box
      width="100%"
      height="100%"
      backgroundColor={C.bg}
      flexDirection="column"
    >
      {/* Header */}
      <box height={3} backgroundColor={C.bgAlt} borderStyle="single" borderColor={C.border}>
        <text fg={C.title} paddingLeft={2} paddingTop={1}>
          ╔══ BIZCANVAS ══╗
        </text>
        <text fg={C.textDim} position="absolute" right={2} top={1}>
          [{state.view.toUpperCase()}]
        </text>
      </box>

      {/* Main content */}
      <box flexGrow={1} flexDirection="row">
        {state.view === "list" && <ListView state={state} />}
        {state.view === "detail" && <DetailView state={state} />}
        {state.view === "links" && <LinksView state={state} />}
        {state.view === "swot" && <SwotView state={state} />}
        {state.view === "collections" && <CollectionsView state={state} />}
      </box>

      {/* Status bar */}
      <box height={1} backgroundColor={C.bgAlt}>
        <text fg={C.accent} paddingLeft={1}>
          {state.message}
        </text>
        <text fg={C.textDim} position="absolute" right={2}>
          {state.notes.length} notes
        </text>
      </box>
    </box>
  )
}

function ListView({ state }: AppProps) {
  const visibleNotes = state.notes.slice(0, 20)

  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
      <text fg={C.title}>┌─ NOTES {state.filter ? `[${state.filter}]` : ""} ─────────────────────────┐</text>

      {visibleNotes.map((note, i) => {
        const selected = i === state.selectedIndex
        const icon = ICONS[note.type] ?? "□"
        const color = selected ? C.highlight : C.text
        const prefix = selected ? "►" : " "

        return (
          <text key={note.id} fg={color}>
            │{prefix}{icon} {note.title.slice(0, 45).padEnd(45)} │
          </text>
        )
      })}

      {state.notes.length === 0 && (
        <text fg={C.textDim}>│ (no notes yet)                                │</text>
      )}

      <text fg={C.title}>└───────────────────────────────────────────────┘</text>

      <box paddingTop={1}>
        <text fg={C.textDim}>
          Filter: 1=all 2=note 3=idea 4=persona 5=pain 6=goal 7=question
        </text>
      </box>
    </box>
  )
}

function DetailView({ state }: AppProps) {
  const note = state.selectedNote
  if (!note) return <text fg={C.text}>No note selected</text>

  const icon = ICONS[note.type] ?? "□"
  const meta = note.metadata as Record<string, unknown> | undefined

  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
      <text fg={C.title}>╔══════════════════════════════════════════════════╗</text>
      <text fg={C.highlight}>║ {icon} {note.title.slice(0, 46).padEnd(46)} ║</text>
      <text fg={C.title}>╠══════════════════════════════════════════════════╣</text>

      <text fg={C.textDim}>║ Type: {note.type.padEnd(42)} ║</text>
      <text fg={C.textDim}>║ ID: {note.id.slice(0, 8).padEnd(44)} ║</text>

      {note.content && (
        <>
          <text fg={C.title}>╠──────────────────────────────────────────────────╣</text>
          {note.content.slice(0, 200).split("\n").slice(0, 5).map((line, i) => (
            <text key={i} fg={C.text}>║ {line.slice(0, 48).padEnd(48)} ║</text>
          ))}
        </>
      )}

      {meta && note.type === "persona" && (
        <>
          <text fg={C.title}>╠──────────────────────────────────────────────────╣</text>
          {(meta.goals as string[] | undefined)?.slice(0, 3).map((g, i) => (
            <text key={i} fg={C.accent}>║ ★ {String(g).slice(0, 45).padEnd(45)} ║</text>
          ))}
          {(meta.painPoints as string[] | undefined)?.slice(0, 3).map((p, i) => (
            <text key={i} fg={C.accent2}>║ ▲ {String(p).slice(0, 45).padEnd(45)} ║</text>
          ))}
        </>
      )}

      <text fg={C.title}>╚══════════════════════════════════════════════════╝</text>

      <box paddingTop={1}>
        <text fg={C.accent3}>
          {state.linkedNotes.length} connections │ press x to view links
        </text>
      </box>
    </box>
  )
}

function LinksView({ state }: AppProps) {
  const note = state.selectedNote
  if (!note) return <text fg={C.text}>No note selected</text>

  const incoming = state.linkedNotes.filter(l => l.direction === "incoming")
  const outgoing = state.linkedNotes.filter(l => l.direction === "outgoing")

  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
      <text fg={C.title}>┌─ CONNECTIONS ─────────────────────────────────┐</text>

      {/* Incoming */}
      {incoming.length > 0 && (
        <>
          <text fg={C.textDim}>│ INCOMING:                                     │</text>
          {incoming.map(({ note: n, link }) => (
            <text key={n.id} fg={C.accent3}>
              │   {ICONS[n.type] ?? "□"} {n.title.slice(0, 30)} ──[{link.label ?? "→"}]──► │
            </text>
          ))}
        </>
      )}

      {/* Center node */}
      <text fg={C.title}>├───────────────────────────────────────────────┤</text>
      <text fg={C.highlight}>│     ╔═══ {note.title.slice(0, 28).padEnd(28)} ═══╗     │</text>
      <text fg={C.title}>├───────────────────────────────────────────────┤</text>

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <>
          <text fg={C.textDim}>│ OUTGOING:                                     │</text>
          {outgoing.map(({ note: n, link }) => (
            <text key={n.id} fg={C.accent}>
              │   ──[{link.label ?? "→"}]──► {ICONS[n.type] ?? "□"} {n.title.slice(0, 28)} │
            </text>
          ))}
        </>
      )}

      {state.linkedNotes.length === 0 && (
        <text fg={C.textDim}>│ (no connections)                              │</text>
      )}

      <text fg={C.title}>└───────────────────────────────────────────────┘</text>
    </box>
  )
}

function SwotView({ state }: AppProps) {
  const col = state.selectedCollection
  const notes = state.swotNotes

  const strengths = notes.filter(n => n.type === "swot_s")
  const weaknesses = notes.filter(n => n.type === "swot_w")
  const opportunities = notes.filter(n => n.type === "swot_o")
  const threats = notes.filter(n => n.type === "swot_t")

  const renderQuadrant = (items: Note[], label: string, icon: string, color: string) => (
    <box width="50%" flexDirection="column">
      <text fg={color}> {icon} {label}</text>
      {items.slice(0, 5).map((n, i) => (
        <text key={n.id} fg={C.text}>   • {n.title.slice(0, 30)}</text>
      ))}
      {items.length === 0 && <text fg={C.textDim}>   (empty)</text>}
    </box>
  )

  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
      <text fg={C.title}>╔══ SWOT: {col?.name.slice(0, 38) ?? "Analysis"} ══╗</text>
      <text fg={C.title}>╠═════════════════════════╦═════════════════════════╣</text>

      <box flexDirection="row" height={8}>
        {renderQuadrant(strengths, "STRENGTHS", "▲", C.strength)}
        {renderQuadrant(weaknesses, "WEAKNESSES", "▼", C.weakness)}
      </box>

      <text fg={C.title}>╠═════════════════════════╬═════════════════════════╣</text>

      <box flexDirection="row" height={8}>
        {renderQuadrant(opportunities, "OPPORTUNITIES", "►", C.opportunity)}
        {renderQuadrant(threats, "THREATS", "◄", C.threat)}
      </box>

      <text fg={C.title}>╚═════════════════════════╩═════════════════════════╝</text>
    </box>
  )
}

function CollectionsView({ state }: AppProps) {
  return (
    <box flexGrow={1} flexDirection="column" paddingLeft={1} paddingTop={1}>
      <text fg={C.title}>┌─ COLLECTIONS ─────────────────────────────────┐</text>

      {state.collections.map((col, i) => {
        const selected = i === state.selectedIndex
        const color = selected ? C.highlight : C.text
        const prefix = selected ? "►" : " "
        const typeIcon = col.type === "swot" ? "◈" : col.type === "mindmap" ? "◉" : "□"

        return (
          <text key={col.id} fg={color}>
            │{prefix}{typeIcon} {col.name.slice(0, 35).padEnd(35)} [{col.type}] │
          </text>
        )
      })}

      {state.collections.length === 0 && (
        <text fg={C.textDim}>│ (no collections)                              │</text>
      )}

      <text fg={C.title}>└───────────────────────────────────────────────┘</text>
    </box>
  )
}
