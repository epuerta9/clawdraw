import React from "react"
import { Box, Text } from "@opentui/react"
import type { Node } from "../state/types"

interface SwotAnalysisProps {
  nodes: Node[]
  width?: number
  height?: number
}

/**
 * SWOT Analysis template - 4 quadrant layout
 *
 * ┌─────────────────┬─────────────────┐
 * │   STRENGTHS     │   WEAKNESSES    │
 * │   (Internal+)   │   (Internal-)   │
 * ├─────────────────┼─────────────────┤
 * │  OPPORTUNITIES  │    THREATS      │
 * │   (External+)   │   (External-)   │
 * └─────────────────┴─────────────────┘
 */
export function SwotAnalysis({ nodes, width = 80, height = 24 }: SwotAnalysisProps) {
  const quadrantWidth = Math.floor(width / 2)
  const quadrantHeight = Math.floor(height / 2)

  const strengths = nodes.filter((n) => n.type === "swot_strength")
  const weaknesses = nodes.filter((n) => n.type === "swot_weakness")
  const opportunities = nodes.filter((n) => n.type === "swot_opportunity")
  const threats = nodes.filter((n) => n.type === "swot_threat")

  const renderQuadrant = (
    title: string,
    items: Node[],
    bgColor: string,
    fgColor: string
  ) => (
    <Box
      width={quadrantWidth}
      height={quadrantHeight}
      backgroundColor={bgColor}
      borderStyle="single"
      borderColor="#4b5563"
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
    >
      <Text fg={fgColor} attributes={1 /* BOLD */}>
        {title}
      </Text>
      <Box flexDirection="column" paddingTop={1}>
        {items.slice(0, quadrantHeight - 3).map((node, i) => (
          <Text key={node.id} fg="#e5e7eb">
            • {node.content.slice(0, quadrantWidth - 5)}
          </Text>
        ))}
        {items.length === 0 && <Text fg="#6b7280">(empty)</Text>}
        {items.length > quadrantHeight - 3 && (
          <Text fg="#6b7280">+{items.length - (quadrantHeight - 3)} more</Text>
        )}
      </Box>
    </Box>
  )

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box paddingBottom={1}>
        <Text fg="#e5e7eb" attributes={1}>
          📊 SWOT Analysis
        </Text>
      </Box>

      {/* Top row: Strengths | Weaknesses */}
      <Box flexDirection="row">
        {renderQuadrant("💪 STRENGTHS", strengths, "#14532d", "#22c55e")}
        {renderQuadrant("⚠️  WEAKNESSES", weaknesses, "#7f1d1d", "#ef4444")}
      </Box>

      {/* Bottom row: Opportunities | Threats */}
      <Box flexDirection="row">
        {renderQuadrant("🚀 OPPORTUNITIES", opportunities, "#1e3a5f", "#3b82f6")}
        {renderQuadrant("⛔ THREATS", threats, "#78350f", "#f59e0b")}
      </Box>
    </Box>
  )
}
