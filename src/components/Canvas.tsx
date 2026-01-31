import React from "react"
import { Box, Text } from "@opentui/react"
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
      <Box
        flexGrow={1}
        backgroundColor="#111827"
        justifyContent="center"
        alignItems="center"
      >
        <Box flexDirection="column" alignItems="center">
          <Text fg="#6b7280">No canvas selected</Text>
          <Text fg="#4b5563" paddingTop={1}>
            Press [n] to create a new canvas
          </Text>
          <Text fg="#4b5563">or [l] to list existing canvases</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexGrow={1} backgroundColor="#111827" position="relative">
      {/* Canvas header */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={1}
        backgroundColor="#1f2937"
        paddingLeft={1}
      >
        <Text fg="#e5e7eb">
          📋 {currentCanvas.name} ({currentCanvas.type})
        </Text>
        <Text fg="#6b7280" position="absolute" right={1}>
          {nodes.length} nodes | {connections.length} connections
        </Text>
      </Box>

      {/* Canvas area - nodes */}
      <Box position="absolute" top={2} left={1} right={1} bottom={1}>
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
          <Box
            position="absolute"
            top={10}
            left={20}
            flexDirection="column"
            alignItems="center"
          >
            <Text fg="#4b5563">Empty canvas</Text>
            <Text fg="#374151" paddingTop={1}>
              Use quick add keys (i, p, o, u, g, t, q) to add nodes
            </Text>
          </Box>
        )}
      </Box>

      {/* Connection indicators (simplified - just labels for now) */}
      {connections.length > 0 && (
        <Box position="absolute" bottom={0} left={1}>
          <Text fg="#6b7280">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </Text>
        </Box>
      )}
    </Box>
  )
}
