import React from "react"
import { Box, Text } from "@opentui/react"
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

export function Sidebar({ state, onAddNode, onModeChange }: SidebarProps) {
  return (
    <Box
      width={24}
      height="100%"
      backgroundColor="#1f2937"
      borderStyle="single"
      borderColor="#374151"
      flexDirection="column"
    >
      {/* Header */}
      <Box paddingLeft={1} paddingTop={1}>
        <Text fg="#f3f4f6" attributes={1 /* BOLD */}>
          bizcanvas
        </Text>
      </Box>

      {/* Canvas info */}
      <Box paddingLeft={1} paddingTop={1}>
        <Text fg="#9ca3af">
          {state.currentCanvas?.name ?? "No canvas"}
        </Text>
      </Box>

      {/* Mode indicator */}
      <Box paddingLeft={1} paddingTop={1}>
        <Text fg="#60a5fa">
          Mode: {state.mode.toUpperCase()}
        </Text>
      </Box>

      {/* Divider */}
      <Box paddingTop={1} paddingLeft={1}>
        <Text fg="#4b5563">────────────────────</Text>
      </Box>

      {/* Quick add */}
      <Box paddingLeft={1} paddingTop={1} flexDirection="column">
        <Text fg="#e5e7eb" attributes={1}>Quick Add:</Text>
        {QUICK_ADD_ITEMS.map((item) => (
          <Text key={item.type} fg="#9ca3af">
            [{item.key}] {item.label}
          </Text>
        ))}
      </Box>

      {/* Divider */}
      <Box paddingTop={1} paddingLeft={1}>
        <Text fg="#4b5563">────────────────────</Text>
      </Box>

      {/* Mode controls */}
      <Box paddingLeft={1} paddingTop={1} flexDirection="column">
        <Text fg="#e5e7eb" attributes={1}>Modes:</Text>
        <Text fg={state.mode === "view" ? "#22c55e" : "#9ca3af"}>[v] View</Text>
        <Text fg={state.mode === "edit" ? "#22c55e" : "#9ca3af"}>[e] Edit</Text>
        <Text fg={state.mode === "connect" ? "#22c55e" : "#9ca3af"}>[c] Connect</Text>
        <Text fg={state.mode === "ai" ? "#22c55e" : "#9ca3af"}>[a] AI Chat</Text>
      </Box>

      {/* Divider */}
      <Box paddingTop={1} paddingLeft={1}>
        <Text fg="#4b5563">────────────────────</Text>
      </Box>

      {/* Stats */}
      <Box paddingLeft={1} paddingTop={1} flexDirection="column">
        <Text fg="#9ca3af">Nodes: {state.nodes.length}</Text>
        <Text fg="#9ca3af">Links: {state.connections.length}</Text>
      </Box>

      {/* Help hint */}
      <Box position="absolute" bottom={1} left={1}>
        <Text fg="#6b7280">[?] Help  [Q] Quit</Text>
      </Box>
    </Box>
  )
}
