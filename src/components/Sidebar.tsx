import type { AppState, NodeType } from "../state/types"

interface SidebarProps {
  state: AppState
  onAddNode: (type: NodeType) => void
  onModeChange: (mode: AppState["mode"]) => void
}

const QUICK_ADD_ITEMS: { type: NodeType; label: string; key: string }[] = [
  { type: "idea", label: "💡 Idea", key: "i" },
  { type: "painpoint", label: "🔥 Pain Point", key: "p" },
  { type: "opportunity", label: "🎯 Opportunity", key: "o" },
  { type: "persona", label: "👤 Persona", key: "u" },
  { type: "goal", label: "⭐ Goal", key: "g" },
  { type: "task", label: "✅ Task", key: "t" },
  { type: "question", label: "❓ Question", key: "q" },
]

export function Sidebar({ state }: SidebarProps) {
  return (
    <box
      width={24}
      height="100%"
      backgroundColor="#1f2937"
      borderStyle="single"
      borderColor="#374151"
      flexDirection="column"
    >
      {/* Header */}
      <box paddingLeft={1} paddingTop={1}>
        <text fg="#f3f4f6" attributes={1}>
          bizcanvas
        </text>
      </box>

      {/* Canvas info */}
      <box paddingLeft={1} paddingTop={1}>
        <text fg="#9ca3af">
          {state.currentCanvas?.name ?? "No canvas"}
        </text>
      </box>

      {/* Mode indicator */}
      <box paddingLeft={1} paddingTop={1}>
        <text fg="#60a5fa">
          Mode: {state.mode.toUpperCase()}
        </text>
      </box>

      {/* Divider */}
      <box paddingTop={1} paddingLeft={1}>
        <text fg="#4b5563">────────────────────</text>
      </box>

      {/* Quick add */}
      <box paddingLeft={1} paddingTop={1} flexDirection="column">
        <text fg="#e5e7eb" attributes={1}>Quick Add:</text>
        {QUICK_ADD_ITEMS.map((item) => (
          <text key={item.type} fg="#9ca3af">
            [{item.key}] {item.label}
          </text>
        ))}
      </box>

      {/* Divider */}
      <box paddingTop={1} paddingLeft={1}>
        <text fg="#4b5563">────────────────────</text>
      </box>

      {/* Mode controls */}
      <box paddingLeft={1} paddingTop={1} flexDirection="column">
        <text fg="#e5e7eb" attributes={1}>Modes:</text>
        <text fg={state.mode === "view" ? "#22c55e" : "#9ca3af"}>[v] View</text>
        <text fg={state.mode === "edit" ? "#22c55e" : "#9ca3af"}>[e] Edit</text>
        <text fg={state.mode === "connect" ? "#22c55e" : "#9ca3af"}>[c] Connect</text>
        <text fg={state.mode === "ai" ? "#22c55e" : "#9ca3af"}>[a] AI Chat</text>
      </box>

      {/* Divider */}
      <box paddingTop={1} paddingLeft={1}>
        <text fg="#4b5563">────────────────────</text>
      </box>

      {/* Stats */}
      <box paddingLeft={1} paddingTop={1} flexDirection="column">
        <text fg="#9ca3af">Nodes: {state.nodes.length}</text>
        <text fg="#9ca3af">Links: {state.connections.length}</text>
      </box>

      {/* Help hint */}
      <box position="absolute" bottom={1} left={1}>
        <text fg="#6b7280">[?] Help  [Q] Quit</text>
      </box>
    </box>
  )
}
