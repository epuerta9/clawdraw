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
 */
export function PersonaCard({ persona, width = 60 }: PersonaProps) {
  const halfWidth = Math.floor((width - 4) / 2)

  return (
    <box
      width={width}
      backgroundColor="#1f2937"
      borderStyle="double"
      borderColor="#8b5cf6"
      flexDirection="column"
    >
      {/* Header */}
      <box paddingLeft={1} paddingTop={1} paddingBottom={1} backgroundColor="#374151">
        <text fg="#e5e7eb" attributes={1}>
          {persona.avatar ?? "👤"} {persona.name}
        </text>
      </box>
      <box paddingLeft={1} backgroundColor="#374151">
        <text fg="#9ca3af">{persona.role}</text>
      </box>

      {/* Quote */}
      {persona.quote && (
        <box paddingLeft={1} paddingTop={1} paddingBottom={1}>
          <text fg="#a78bfa" attributes={2}>
            "{persona.quote.slice(0, width - 6)}"
          </text>
        </box>
      )}

      {/* Demographics + Goals */}
      <box flexDirection="row" paddingTop={1}>
        <box width={halfWidth} paddingLeft={1} flexDirection="column">
          <text fg="#60a5fa" attributes={1}>DEMOGRAPHICS</text>
          {persona.demographics?.age && (
            <text fg="#9ca3af">Age: {persona.demographics.age}</text>
          )}
          {persona.demographics?.location && (
            <text fg="#9ca3af">📍 {persona.demographics.location}</text>
          )}
          {persona.demographics?.income && (
            <text fg="#9ca3af">💰 {persona.demographics.income}</text>
          )}
        </box>
        <box width={halfWidth} paddingLeft={1} flexDirection="column">
          <text fg="#22c55e" attributes={1}>GOALS</text>
          {persona.goals.slice(0, 3).map((goal, i) => (
            <text key={i} fg="#9ca3af">🎯 {goal.slice(0, halfWidth - 4)}</text>
          ))}
        </box>
      </box>

      {/* Pain Points + Motivations */}
      <box flexDirection="row" paddingTop={1} paddingBottom={1}>
        <box width={halfWidth} paddingLeft={1} flexDirection="column">
          <text fg="#ef4444" attributes={1}>PAIN POINTS</text>
          {persona.painPoints.slice(0, 3).map((pain, i) => (
            <text key={i} fg="#9ca3af">🔥 {pain.slice(0, halfWidth - 4)}</text>
          ))}
        </box>
        <box width={halfWidth} paddingLeft={1} flexDirection="column">
          <text fg="#fbbf24" attributes={1}>MOTIVATIONS</text>
          {persona.motivations.slice(0, 3).map((mot, i) => (
            <text key={i} fg="#9ca3af">⭐ {mot.slice(0, halfWidth - 4)}</text>
          ))}
        </box>
      </box>
    </box>
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
