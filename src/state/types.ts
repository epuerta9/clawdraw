// Canvas types
export type CanvasType = "freeform" | "mindmap" | "swot" | "persona" | "journey"

export interface Canvas {
  id: string
  name: string
  type: CanvasType
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Node types
export type NodeType =
  | "text"
  | "idea"
  | "persona"
  | "painpoint"
  | "opportunity"
  | "goal"
  | "task"
  | "question"
  // SWOT specific
  | "swot_strength"
  | "swot_weakness"
  | "swot_opportunity"
  | "swot_threat"
  // Journey specific
  | "journey_stage"
  | "journey_touchpoint"
  | "journey_emotion"

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface NodeMetadata {
  color?: string
  icon?: string
  priority?: "low" | "medium" | "high" | "critical"
  status?: "draft" | "review" | "approved" | "archived"
  [key: string]: unknown
}

export interface Node {
  id: string
  canvasId: string
  type: NodeType
  content: string
  metadata?: NodeMetadata
  position: Position
  size: Size
  parentId?: string
  zIndex: number
  createdAt: string
  updatedAt: string
}

// Connection types
export type ConnectionType = "arrow" | "line" | "dashed" | "bidirectional"

export interface ConnectionMetadata {
  color?: string
  thickness?: number
  animated?: boolean
  [key: string]: unknown
}

export interface Connection {
  id: string
  canvasId: string
  sourceId: string
  targetId: string
  type: ConnectionType
  label?: string
  metadata?: ConnectionMetadata
  createdAt: string
}

// Tag types
export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

// App state
export interface AppState {
  currentCanvas: Canvas | null
  nodes: Node[]
  connections: Connection[]
  tags: Tag[]
  selectedNodeId: string | null
  focusedNodeId: string | null
  mode: "view" | "edit" | "connect" | "ai"
}

// Actions
export type Action =
  | { type: "SET_CANVAS"; payload: Canvas }
  | { type: "SET_NODES"; payload: Node[] }
  | { type: "ADD_NODE"; payload: Node }
  | { type: "UPDATE_NODE"; payload: Partial<Node> & { id: string } }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "SET_CONNECTIONS"; payload: Connection[] }
  | { type: "ADD_CONNECTION"; payload: Connection }
  | { type: "DELETE_CONNECTION"; payload: string }
  | { type: "SELECT_NODE"; payload: string | null }
  | { type: "FOCUS_NODE"; payload: string | null }
  | { type: "SET_MODE"; payload: AppState["mode"] }
  | { type: "SET_TAGS"; payload: Tag[] }
