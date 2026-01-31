import React from "react"
import { Box, Text } from "@opentui/react"

interface PersonaData {
  name: string
  role: string
  avatar?: string
  demographics?: {
    age?: string
    location?: string
    income?: string
    education?: string
  }
  goals: string[]
  painPoints: string[]
  motivations: string[]
  behaviors: string[]
  quote?: string
}

interface PersonaProps {
  persona: PersonaData
  width?: number
}

/**
 * Persona Card template
 *
 * ┌────────────────────────────────────┐
 * │  👤 Sarah Chen                     │
 * │  Product Manager @ TechCorp        │
 * ├────────────────────────────────────┤
 * │  "I need tools that help me..."    │
 * ├────────────────────────────────────┤
 * │  DEMOGRAPHICS    │  GOALS          │
 * │  Age: 32         │  • Goal 1       │
 * │  Location: SF    │  • Goal 2       │
 * ├────────────────────────────────────┤
 * │  PAIN POINTS     │  MOTIVATIONS    │
 * │  🔥 Pain 1       │  ⭐ Motivation  │
 * └────────────────────────────────────┘
 */
export function PersonaCard({ persona, width = 60 }: PersonaProps) {
  const halfWidth = Math.floor((width - 4) / 2)

  return (
    <Box
      width={width}
      backgroundColor="#1f2937"
      borderStyle="double"
      borderColor="#8b5cf6"
      flexDirection="column"
    >
      {/* Header */}
      <Box paddingLeft={1} paddingTop={1} paddingBottom={1} backgroundColor="#374151">
        <Text fg="#e5e7eb" attributes={1}>
          {persona.avatar ?? "👤"} {persona.name}
        </Text>
      </Box>
      <Box paddingLeft={1} backgroundColor="#374151">
        <Text fg="#9ca3af">{persona.role}</Text>
      </Box>

      {/* Quote */}
      {persona.quote && (
        <Box paddingLeft={1} paddingTop={1} paddingBottom={1}>
          <Text fg="#a78bfa" attributes={2 /* ITALIC */}>
            "{persona.quote.slice(0, width - 6)}"
          </Text>
        </Box>
      )}

      {/* Demographics + Goals */}
      <Box flexDirection="row" paddingTop={1}>
        <Box width={halfWidth} paddingLeft={1} flexDirection="column">
          <Text fg="#60a5fa" attributes={1}>DEMOGRAPHICS</Text>
          {persona.demographics?.age && (
            <Text fg="#9ca3af">Age: {persona.demographics.age}</Text>
          )}
          {persona.demographics?.location && (
            <Text fg="#9ca3af">📍 {persona.demographics.location}</Text>
          )}
          {persona.demographics?.income && (
            <Text fg="#9ca3af">💰 {persona.demographics.income}</Text>
          )}
        </Box>
        <Box width={halfWidth} paddingLeft={1} flexDirection="column">
          <Text fg="#22c55e" attributes={1}>GOALS</Text>
          {persona.goals.slice(0, 3).map((goal, i) => (
            <Text key={i} fg="#9ca3af">🎯 {goal.slice(0, halfWidth - 4)}</Text>
          ))}
        </Box>
      </Box>

      {/* Pain Points + Motivations */}
      <Box flexDirection="row" paddingTop={1} paddingBottom={1}>
        <Box width={halfWidth} paddingLeft={1} flexDirection="column">
          <Text fg="#ef4444" attributes={1}>PAIN POINTS</Text>
          {persona.painPoints.slice(0, 3).map((pain, i) => (
            <Text key={i} fg="#9ca3af">🔥 {pain.slice(0, halfWidth - 4)}</Text>
          ))}
        </Box>
        <Box width={halfWidth} paddingLeft={1} flexDirection="column">
          <Text fg="#fbbf24" attributes={1}>MOTIVATIONS</Text>
          {persona.motivations.slice(0, 3).map((mot, i) => (
            <Text key={i} fg="#9ca3af">⭐ {mot.slice(0, halfWidth - 4)}</Text>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// Helper to create persona from nodes
export function createPersonaFromNodes(
  nameNode: { content: string },
  roleNode?: { content: string },
  goalNodes: { content: string }[] = [],
  painNodes: { content: string }[] = [],
  motivationNodes: { content: string }[] = []
): PersonaData {
  return {
    name: nameNode.content,
    role: roleNode?.content ?? "User",
    goals: goalNodes.map((n) => n.content),
    painPoints: painNodes.map((n) => n.content),
    motivations: motivationNodes.map((n) => n.content),
    behaviors: [],
  }
}
