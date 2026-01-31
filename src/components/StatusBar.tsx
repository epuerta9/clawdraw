import React from "react"
import { Box, Text } from "@opentui/react"
import type { AppState } from "../state/types"

interface StatusBarProps {
  state: AppState
  message?: string
}

export function StatusBar({ state, message }: StatusBarProps) {
  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId)

  return (
    <Box
      height={1}
      backgroundColor="#1f2937"
      borderStyle="single"
      borderColor="#374151"
      flexDirection="row"
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Mode */}
      <Text fg="#60a5fa">[{state.mode.toUpperCase()}]</Text>

      {/* Selected node info */}
      {selectedNode && (
        <Text fg="#9ca3af" paddingLeft={2}>
          Selected: {selectedNode.type} - "{selectedNode.content.slice(0, 20)}..."
        </Text>
      )}

      {/* Message */}
      {message && (
        <Text fg="#fbbf24" paddingLeft={2}>
          {message}
        </Text>
      )}

      {/* Right side - help */}
      <Box flexGrow={1} />
      <Text fg="#6b7280">
        ? Help | Ctrl+S Save | Q Quit
      </Text>
    </Box>
  )
}
