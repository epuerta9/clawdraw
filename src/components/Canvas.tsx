import type { AppState } from "../state/types"
import { NodeComponent } from "./Node"

interface CanvasProps {
  state: AppState
  onSelectNode: (id: string | null) => void
}

export function Canvas({ state, onSelectNode }: CanvasProps) {
  const { nodes, connections, selectedNodeId, focusedNodeId, currentCanvas } = state

  if (!currentCanvas) {
    return (
      <box
        flexGrow={1}
        backgroundColor="#111827"
        justifyContent="center"
        alignItems="center"
      >
        <box flexDirection="column" alignItems="center">
          <text fg="#6b7280">No canvas selected</text>
          <text fg="#4b5563" paddingTop={1}>
            Press [n] to create a new canvas
          </text>
          <text fg="#4b5563">or [l] to list existing canvases</text>
        </box>
      </box>
    )
  }

  return (
    <box flexGrow={1} backgroundColor="#111827" position="relative">
      {/* Canvas header */}
      <box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={1}
        backgroundColor="#1f2937"
        paddingLeft={1}
      >
        <text fg="#e5e7eb">
          📋 {currentCanvas.name} ({currentCanvas.type})
        </text>
        <text fg="#6b7280" position="absolute" right={1}>
          {nodes.length} nodes | {connections.length} connections
        </text>
      </box>

      {/* Canvas area - nodes */}
      <box position="absolute" top={2} left={1} right={1} bottom={1}>
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isFocused={node.id === focusedNodeId}
            onSelect={() => onSelectNode(node.id)}
          />
        ))}

        {/* Empty state */}
        {nodes.length === 0 && (
          <box
            position="absolute"
            top={10}
            left={20}
            flexDirection="column"
            alignItems="center"
          >
            <text fg="#4b5563">Empty canvas</text>
            <text fg="#374151" paddingTop={1}>
              Use quick add keys (i, p, o, u, g, t, q) to add nodes
            </text>
          </box>
        )}
      </box>

      {/* Connection indicators (simplified - just labels for now) */}
      {connections.length > 0 && (
        <box position="absolute" bottom={0} left={1}>
          <text fg="#6b7280">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </text>
        </box>
      )}
    </box>
  )
}
