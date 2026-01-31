import type { Node as NodeType } from "../state/types"

interface NodeProps {
  node: NodeType
  isSelected: boolean
  isFocused: boolean
  onSelect: () => void
}

const NODE_COLORS: Record<string, string> = {
  text: "#374151",
  idea: "#6366f1",
  persona: "#8b5cf6",
  painpoint: "#ef4444",
  opportunity: "#22c55e",
  goal: "#f59e0b",
  task: "#3b82f6",
  question: "#ec4899",
  swot_strength: "#22c55e",
  swot_weakness: "#ef4444",
  swot_opportunity: "#3b82f6",
  swot_threat: "#f59e0b",
  journey_stage: "#6366f1",
  journey_touchpoint: "#8b5cf6",
  journey_emotion: "#ec4899",
}

const NODE_ICONS: Record<string, string> = {
  text: "📝",
  idea: "💡",
  persona: "👤",
  painpoint: "🔥",
  opportunity: "🎯",
  goal: "⭐",
  task: "✅",
  question: "❓",
  swot_strength: "💪",
  swot_weakness: "⚠️",
  swot_opportunity: "🚀",
  swot_threat: "⛔",
  journey_stage: "📍",
  journey_touchpoint: "🤝",
  journey_emotion: "😊",
}

export function NodeComponent({ node, isSelected, isFocused }: NodeProps) {
  const bgColor = node.metadata?.color ?? NODE_COLORS[node.type] ?? "#374151"
  const icon = node.metadata?.icon ?? NODE_ICONS[node.type] ?? "📌"
  const borderColor = isSelected ? "#fbbf24" : isFocused ? "#60a5fa" : "#4b5563"
  const borderStyle = isSelected ? "double" : "single"

  return (
    <box
      position="absolute"
      left={Math.round(node.position.x)}
      top={Math.round(node.position.y)}
      width={Math.round(node.size.width / 8)}
      height={Math.round(node.size.height / 16)}
      backgroundColor={bgColor}
      borderStyle={borderStyle}
      borderColor={borderColor}
      paddingLeft={1}
      paddingRight={1}
    >
      <text fg="#e5e7eb">
        {icon} {node.content.slice(0, 30)}{node.content.length > 30 ? "..." : ""}
      </text>
      {node.metadata?.priority && (
        <text fg="#9ca3af" position="absolute" right={1} top={0}>
          [{node.metadata.priority.charAt(0).toUpperCase()}]
        </text>
      )}
    </box>
  )
}
