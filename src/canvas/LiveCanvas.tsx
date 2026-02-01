// Live Canvas Component - renders an infinite canvas with zones and nodes
import type { Canvas, Template, Zone, CanvasNode } from "./types"
import type { Note } from "../service"

// ANSI colors
const COLORS: Record<string, string> = {
  "#00ff41": "38;2;0;255;65",      // matrix green
  "#ff6b6b": "38;2;255;107;107",   // coral
  "#4ecdc4": "38;2;78;205;196",    // teal
  "#ff8c00": "38;2;255;140;0",     // orange
  "#9b59b6": "38;2;155;89;182",    // purple
  "#3498db": "38;2;52;152;219",    // blue
  "#2ecc71": "38;2;46;204;113",    // green
  "#e74c3c": "38;2;231;76;60",     // red
  "#f39c12": "38;2;243;156;18",    // yellow
  "#1abc9c": "38;2;26;188;156",    // turquoise
  "#e67e22": "38;2;230;126;34",    // carrot
  "#7f8c8d": "38;2;127;140;141",   // gray
  "#27ae60": "38;2;39;174;96",     // nephritis
  "#95a5a6": "38;2;149;165;166",   // silver
}

function getColor(hex: string): string {
  return COLORS[hex] ?? "38;2;204;204;204"
}

interface LiveCanvasProps {
  canvas: Canvas
  template: Template
  notes: Map<string, Note>
  width: number
  height: number
}

export function LiveCanvas({ canvas, template, notes, width, height }: LiveCanvasProps) {
  const { viewport } = canvas

  // Adjust for viewport
  const offsetX = Math.floor(viewport.x)
  const offsetY = Math.floor(viewport.y)

  return (
    <box width="100%" height="100%" backgroundColor="#0f0f23" flexDirection="column">
      {/* Header */}
      <box height={3} backgroundColor="#1a1a2e" borderStyle="single" borderColor="#3d3d5c">
        <text fg="#ffcc00" paddingLeft={2} paddingTop={1}>
          ╔══ {canvas.name.toUpperCase()} ══╗
        </text>
        <text fg="#666680" position="absolute" right={2} top={1}>
          [{template.name}] zoom:{viewport.zoom.toFixed(1)}x
        </text>
      </box>

      {/* Canvas area */}
      <box flexGrow={1} flexDirection="column" overflow="hidden">
        {/* Render zones */}
        {template.zones.map((zone) => (
          <ZoneBox
            key={zone.id}
            zone={zone}
            nodes={canvas.nodes.filter(n => n.zoneId === zone.id)}
            notes={notes}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        ))}

        {/* Render unzoned nodes */}
        {canvas.nodes.filter(n => !n.zoneId).map((node) => (
          <NodeBox
            key={node.id}
            node={node}
            note={notes.get(node.noteId)}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        ))}
      </box>

      {/* Status bar */}
      <box height={1} backgroundColor="#1a1a2e">
        <text fg="#00ff41" paddingLeft={1}>
          {canvas.nodes.length} items │ arrows:pan │ +/-:zoom │ q:quit │ t:templates
        </text>
        <text fg="#666680" position="absolute" right={2}>
          LIVE
        </text>
      </box>
    </box>
  )
}

interface ZoneBoxProps {
  zone: Zone
  nodes: CanvasNode[]
  notes: Map<string, Note>
  offsetX: number
  offsetY: number
}

function ZoneBox({ zone, nodes, notes, offsetX, offsetY }: ZoneBoxProps) {
  const x = zone.position.x - offsetX
  const y = zone.position.y - offsetY

  // Skip if out of view
  if (x + zone.size.width < 0 || y + zone.size.height < 0) return null

  return (
    <box
      position="absolute"
      left={Math.max(0, x)}
      top={Math.max(0, y)}
      width={zone.size.width}
      height={zone.size.height}
      borderStyle="single"
      borderColor={zone.color}
    >
      <text fg={zone.color} paddingLeft={1}>
        {zone.icon ?? "■"} {zone.label}
      </text>

      {/* Render nodes in zone */}
      {nodes.map((node, i) => {
        const note = notes.get(node.noteId)
        if (!note) return null

        return (
          <text key={node.id} fg="#cccccc" paddingLeft={2} top={2 + i}>
            • {note.title.slice(0, zone.size.width - 6)}
          </text>
        )
      })}

      {nodes.length === 0 && (
        <text fg="#666680" paddingLeft={2} top={2}>
          (empty)
        </text>
      )}
    </box>
  )
}

interface NodeBoxProps {
  node: CanvasNode
  note: Note | undefined
  offsetX: number
  offsetY: number
}

function NodeBox({ node, note, offsetX, offsetY }: NodeBoxProps) {
  if (!note) return null

  const x = node.position.x - offsetX
  const y = node.position.y - offsetY

  // Skip if out of view
  if (x + node.size.width < 0 || y + node.size.height < 0) return null
  if (x > 200 || y > 50) return null

  const color = node.color ?? "#ffcc00"

  return (
    <box
      position="absolute"
      left={Math.max(0, x)}
      top={Math.max(0, y)}
      width={node.size.width}
      height={node.size.height}
      backgroundColor="#1a1a2e"
      borderStyle="single"
      borderColor={color}
    >
      <text fg={color} paddingLeft={1}>
        {note.title.slice(0, node.size.width - 4)}
      </text>
    </box>
  )
}
