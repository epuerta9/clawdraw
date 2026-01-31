import React from "react"
import { Box, Text } from "@opentui/react"
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
 *
 * Central Idea
 * ├── Branch 1
 * │   ├── Sub-idea 1.1
 * │   └── Sub-idea 1.2
 * ├── Branch 2
 * │   └── Sub-idea 2.1
 * └── Branch 3
 */
export function MindMap({ nodes, connections, rootId }: MindMapProps) {
  // Build tree structure
  const buildTree = (): TreeNode | null => {
    if (nodes.length === 0) return null

    // Find root (either specified, or node with most outgoing connections, or first node)
    let root: Node | undefined
    if (rootId) {
      root = nodes.find((n) => n.id === rootId)
    }
    if (!root) {
      // Find node with no incoming connections (likely root)
      const hasIncoming = new Set(connections.map((c) => c.targetId))
      root = nodes.find((n) => !hasIncoming.has(n.id)) ?? nodes[0]
    }

    const visited = new Set<string>()

    const buildNode = (node: Node, depth: number): TreeNode => {
      visited.add(node.id)

      // Find children via connections OR parent_id
      const childIds = new Set<string>()

      // From connections
      connections
        .filter((c) => c.sourceId === node.id && !visited.has(c.targetId))
        .forEach((c) => childIds.add(c.targetId))

      // From parent_id
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

  const renderTree = (treeNode: TreeNode, isLast: boolean, prefix: string): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    const { node, children, depth } = treeNode

    // Connector characters
    const connector = isLast ? "└── " : "├── "
    const childPrefix = isLast ? "    " : "│   "

    // Color based on depth
    const colors = ["#f3f4f6", "#60a5fa", "#22c55e", "#fbbf24", "#a78bfa", "#ec4899"]
    const color = colors[depth % colors.length]

    // Node content
    const icon = depth === 0 ? "🎯" : "•"
    const maxLen = 50 - prefix.length
    const content = node.content.slice(0, maxLen)

    result.push(
      <Text key={node.id} fg={color}>
        {prefix}{depth > 0 ? connector : ""}{icon} {content}
      </Text>
    )

    // Render children
    children.forEach((child, i) => {
      const isChildLast = i === children.length - 1
      const newPrefix = depth === 0 ? "" : prefix + childPrefix
      result.push(...renderTree(child, isChildLast, newPrefix))
    })

    return result
  }

  if (!tree) {
    return (
      <Box flexDirection="column">
        <Text fg="#6b7280">Empty mind map</Text>
        <Text fg="#4b5563">Add nodes and connections to build your map</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box paddingBottom={1}>
        <Text fg="#e5e7eb" attributes={1}>🧠 Mind Map</Text>
        <Text fg="#6b7280" paddingLeft={2}>
          ({nodes.length} nodes, {connections.length} connections)
        </Text>
      </Box>
      <Box flexDirection="column">
        {renderTree(tree, true, "")}
      </Box>
    </Box>
  )
}
