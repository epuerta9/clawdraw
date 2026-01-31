import type { AppState } from "../state/types"

interface StatusBarProps {
  state: AppState
  message?: string
}

export function StatusBar({ state, message }: StatusBarProps) {
  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId)

  return (
    <box
      height={1}
      backgroundColor="#1f2937"
      borderStyle="single"
      borderColor="#374151"
      flexDirection="row"
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Mode */}
      <text fg="#60a5fa">[{state.mode.toUpperCase()}]</text>

      {/* Selected node info */}
      {selectedNode && (
        <text fg="#9ca3af" paddingLeft={2}>
          Selected: {selectedNode.type} - "{selectedNode.content.slice(0, 20)}..."
        </text>
      )}

      {/* Message */}
      {message && (
        <text fg="#fbbf24" paddingLeft={2}>
          {message}
        </text>
      )}

      {/* Right side - help */}
      <box flexGrow={1} />
      <text fg="#6b7280">
        ? Help | Ctrl+S Save | Q Quit
      </text>
    </box>
  )
}
