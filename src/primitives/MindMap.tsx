import type { ReactNode } from "react"
import type { Node, Connection } from "../state/types"

interface MindMapProps {
  nodes: Node[]
  connections: Connection[]
  rootId?: string
}

interface TreeNode {
  node: Node
  children: TreeNode[]
  depth: number
}

/**
 * Mind Map - hierarchical tree view
 */
export function MindMap({ nodes, connections, rootId }: MindMapProps) {
  // Build tree structure
  const buildTree = (): TreeNode | null => {
    if (nodes.length === 0) return null

    // Find root (either specified, or node with no incoming connections, or first node)
    let root: Node | undefined
    if (rootId) {
      root = nodes.find((n) => n.id === rootId)
    }
    if (!root) {
      const hasIncoming = new Set(connections.map((c) => c.targetId))
      root = nodes.find((n) => !hasIncoming.has(n.id)) ?? nodes[0]
    }

    if (!root) return null

    const visited = new Set<string>()

    const buildNode = (node: Node, depth: number): TreeNode => {
      visited.add(node.id)

      const childIds = new Set<string>()

      connections
        .filter((c) => c.sourceId === node.id && !visited.has(c.targetId))
        .forEach((c) => childIds.add(c.targetId))

      nodes
        .filter((n) => n.parentId === node.id && !visited.has(n.id))
        .forEach((n) => childIds.add(n.id))

      const children = Array.from(childIds)
        .map((id) => nodes.find((n) => n.id === id))
        .filter((n): n is Node => n !== undefined && !visited.has(n.id))
        .map((n) => buildNode(n, depth + 1))

      return { node, children, depth }
    }

    return buildNode(root, 0)
  }

  const tree = buildTree()

  const renderTree = (treeNode: TreeNode, isLast: boolean, prefix: string): ReactNode[] => {
    const result: ReactNode[] = []
    const { node, children, depth } = treeNode

    const connector = isLast ? "└── " : "├── "
    const childPrefix = isLast ? "    " : "│   "

    const colors = ["#f3f4f6", "#60a5fa", "#22c55e", "#fbbf24", "#a78bfa", "#ec4899"]
    const color = colors[depth % colors.length]

    const icon = depth === 0 ? "🎯" : "•"
    const maxLen = 50 - prefix.length
    const content = node.content.slice(0, maxLen)

    result.push(
      <text key={node.id} fg={color}>
        {prefix}{depth > 0 ? connector : ""}{icon} {content}
      </text>
    )

    children.forEach((child, i) => {
      const isChildLast = i === children.length - 1
      const newPrefix = depth === 0 ? "" : prefix + childPrefix
      result.push(...renderTree(child, isChildLast, newPrefix))
    })

    return result
  }

  if (!tree) {
    return (
      <box flexDirection="column">
        <text fg="#6b7280">Empty mind map</text>
        <text fg="#4b5563">Add nodes and connections to build your map</text>
      </box>
    )
  }

  return (
    <box flexDirection="column">
      <box paddingBottom={1}>
        <text fg="#e5e7eb" attributes={1}>🧠 Mind Map</text>
        <text fg="#6b7280" paddingLeft={2}>
          ({nodes.length} nodes, {connections.length} connections)
        </text>
      </box>
      <box flexDirection="column">
        {renderTree(tree, true, "")}
      </box>
    </box>
  )
}
