// Canvas types for infinite canvas with templates

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

// A placed note on the canvas
export interface CanvasNode {
  id: string
  noteId: string
  position: Position
  size: Size
  zoneId?: string  // Which zone this belongs to (for templates)
  color?: string
  style?: "sticky" | "card" | "minimal"
}

// A zone is a region on a template (like SWOT quadrants, BMC boxes)
export interface Zone {
  id: string
  name: string
  label: string
  position: Position
  size: Size
  color: string
  allowedTypes?: string[]  // Note types allowed in this zone
  icon?: string
}

// Template defines the layout of a canvas
export interface Template {
  id: string
  name: string
  description: string
  icon: string
  zones: Zone[]
  defaultSize: Size
  autoPlace?: boolean  // Auto-place notes based on type
}

// Canvas is an instance of a template with placed nodes
export interface Canvas {
  id: string
  name: string
  templateId: string
  viewport: Viewport
  nodes: CanvasNode[]
  createdAt: string
  updatedAt: string
}

// Templates available
export const TEMPLATES: Template[] = [
  {
    id: "swot",
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats",
    icon: "◈",
    defaultSize: { width: 100, height: 40 },
    autoPlace: true,
    zones: [
      { id: "s", name: "strengths", label: "STRENGTHS", position: { x: 0, y: 0 }, size: { width: 50, height: 20 }, color: "#00ff41", allowedTypes: ["swot_s"], icon: "▲" },
      { id: "w", name: "weaknesses", label: "WEAKNESSES", position: { x: 50, y: 0 }, size: { width: 50, height: 20 }, color: "#ff6b6b", allowedTypes: ["swot_w"], icon: "▼" },
      { id: "o", name: "opportunities", label: "OPPORTUNITIES", position: { x: 0, y: 20 }, size: { width: 50, height: 20 }, color: "#4ecdc4", allowedTypes: ["swot_o"], icon: "►" },
      { id: "t", name: "threats", label: "THREATS", position: { x: 50, y: 20 }, size: { width: 50, height: 20 }, color: "#ff8c00", allowedTypes: ["swot_t"], icon: "◄" },
    ],
  },
  {
    id: "bmc",
    name: "Business Model Canvas",
    description: "9-box business model framework",
    icon: "▣",
    defaultSize: { width: 150, height: 50 },
    autoPlace: true,
    zones: [
      { id: "kp", name: "key_partners", label: "KEY PARTNERS", position: { x: 0, y: 0 }, size: { width: 30, height: 30 }, color: "#9b59b6", icon: "◆" },
      { id: "ka", name: "key_activities", label: "KEY ACTIVITIES", position: { x: 30, y: 0 }, size: { width: 30, height: 15 }, color: "#3498db", icon: "★" },
      { id: "kr", name: "key_resources", label: "KEY RESOURCES", position: { x: 30, y: 15 }, size: { width: 30, height: 15 }, color: "#3498db", icon: "■" },
      { id: "vp", name: "value_props", label: "VALUE PROPOSITIONS", position: { x: 60, y: 0 }, size: { width: 30, height: 30 }, color: "#e74c3c", icon: "♦" },
      { id: "cr", name: "customer_rel", label: "CUSTOMER RELATIONSHIPS", position: { x: 90, y: 0 }, size: { width: 30, height: 15 }, color: "#2ecc71", icon: "●" },
      { id: "ch", name: "channels", label: "CHANNELS", position: { x: 90, y: 15 }, size: { width: 30, height: 15 }, color: "#2ecc71", icon: "→" },
      { id: "cs", name: "customer_seg", label: "CUSTOMER SEGMENTS", position: { x: 120, y: 0 }, size: { width: 30, height: 30 }, color: "#f39c12", icon: "●" },
      { id: "cost", name: "cost_structure", label: "COST STRUCTURE", position: { x: 0, y: 30 }, size: { width: 75, height: 20 }, color: "#95a5a6", icon: "$" },
      { id: "rev", name: "revenue_streams", label: "REVENUE STREAMS", position: { x: 75, y: 30 }, size: { width: 75, height: 20 }, color: "#27ae60", icon: "$" },
    ],
  },
  {
    id: "lean",
    name: "Lean Canvas",
    description: "Lean startup canvas for problem/solution fit",
    icon: "◇",
    defaultSize: { width: 150, height: 50 },
    autoPlace: true,
    zones: [
      { id: "problem", name: "problem", label: "PROBLEM", position: { x: 0, y: 0 }, size: { width: 30, height: 20 }, color: "#e74c3c", icon: "!" },
      { id: "solution", name: "solution", label: "SOLUTION", position: { x: 30, y: 0 }, size: { width: 30, height: 20 }, color: "#2ecc71", icon: "✓" },
      { id: "uvp", name: "unique_value", label: "UNIQUE VALUE PROP", position: { x: 60, y: 0 }, size: { width: 30, height: 20 }, color: "#9b59b6", icon: "★" },
      { id: "unfair", name: "unfair_advantage", label: "UNFAIR ADVANTAGE", position: { x: 90, y: 0 }, size: { width: 30, height: 20 }, color: "#f39c12", icon: "◆" },
      { id: "segments", name: "customer_segments", label: "CUSTOMER SEGMENTS", position: { x: 120, y: 0 }, size: { width: 30, height: 20 }, color: "#3498db", icon: "●" },
      { id: "metrics", name: "key_metrics", label: "KEY METRICS", position: { x: 0, y: 20 }, size: { width: 50, height: 15 }, color: "#1abc9c", icon: "#" },
      { id: "channels", name: "channels", label: "CHANNELS", position: { x: 50, y: 20 }, size: { width: 50, height: 15 }, color: "#e67e22", icon: "→" },
      { id: "costs", name: "cost_structure", label: "COST STRUCTURE", position: { x: 0, y: 35 }, size: { width: 75, height: 15 }, color: "#7f8c8d", icon: "$" },
      { id: "revenue", name: "revenue_streams", label: "REVENUE STREAMS", position: { x: 75, y: 35 }, size: { width: 75, height: 15 }, color: "#27ae60", icon: "$" },
    ],
  },
  {
    id: "empathy",
    name: "Empathy Map",
    description: "Understand your customer's perspective",
    icon: "♥",
    defaultSize: { width: 100, height: 50 },
    autoPlace: true,
    zones: [
      { id: "thinks", name: "thinks_feels", label: "THINKS & FEELS", position: { x: 25, y: 0 }, size: { width: 50, height: 15 }, color: "#e74c3c", icon: "♥" },
      { id: "sees", name: "sees", label: "SEES", position: { x: 0, y: 15 }, size: { width: 25, height: 20 }, color: "#3498db", icon: "◉" },
      { id: "persona", name: "persona", label: "PERSONA", position: { x: 25, y: 15 }, size: { width: 50, height: 20 }, color: "#9b59b6", icon: "●" },
      { id: "hears", name: "hears", label: "HEARS", position: { x: 75, y: 15 }, size: { width: 25, height: 20 }, color: "#2ecc71", icon: "◎" },
      { id: "says", name: "says_does", label: "SAYS & DOES", position: { x: 25, y: 35 }, size: { width: 50, height: 15 }, color: "#f39c12", icon: "◈" },
    ],
  },
  {
    id: "journey",
    name: "User Journey Map",
    description: "Map the customer experience over time",
    icon: "→",
    defaultSize: { width: 150, height: 40 },
    autoPlace: false,
    zones: [
      { id: "aware", name: "awareness", label: "AWARENESS", position: { x: 0, y: 0 }, size: { width: 30, height: 40 }, color: "#3498db", icon: "1" },
      { id: "consider", name: "consideration", label: "CONSIDERATION", position: { x: 30, y: 0 }, size: { width: 30, height: 40 }, color: "#9b59b6", icon: "2" },
      { id: "decide", name: "decision", label: "DECISION", position: { x: 60, y: 0 }, size: { width: 30, height: 40 }, color: "#e74c3c", icon: "3" },
      { id: "purchase", name: "purchase", label: "PURCHASE", position: { x: 90, y: 0 }, size: { width: 30, height: 40 }, color: "#2ecc71", icon: "4" },
      { id: "retain", name: "retention", label: "RETENTION", position: { x: 120, y: 0 }, size: { width: 30, height: 40 }, color: "#f39c12", icon: "5" },
    ],
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Track work in progress",
    icon: "▥",
    defaultSize: { width: 120, height: 40 },
    autoPlace: false,
    zones: [
      { id: "backlog", name: "backlog", label: "BACKLOG", position: { x: 0, y: 0 }, size: { width: 30, height: 40 }, color: "#7f8c8d", icon: "□" },
      { id: "todo", name: "todo", label: "TO DO", position: { x: 30, y: 0 }, size: { width: 30, height: 40 }, color: "#3498db", icon: "○" },
      { id: "progress", name: "in_progress", label: "IN PROGRESS", position: { x: 60, y: 0 }, size: { width: 30, height: 40 }, color: "#f39c12", icon: "◐" },
      { id: "done", name: "done", label: "DONE", position: { x: 90, y: 0 }, size: { width: 30, height: 40 }, color: "#2ecc71", icon: "●" },
    ],
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "Freeform sticky notes canvas",
    icon: "✦",
    defaultSize: { width: 200, height: 100 },
    autoPlace: false,
    zones: [], // No zones - freeform placement
  },
  {
    id: "mindmap",
    name: "Mind Map",
    description: "Radial idea organization",
    icon: "◉",
    defaultSize: { width: 150, height: 80 },
    autoPlace: false,
    zones: [
      { id: "center", name: "center", label: "CENTRAL IDEA", position: { x: 60, y: 30 }, size: { width: 30, height: 20 }, color: "#e74c3c", icon: "◉" },
    ],
  },
  {
    id: "personas",
    name: "Persona Gallery",
    description: "Display multiple personas",
    icon: "●",
    defaultSize: { width: 120, height: 60 },
    autoPlace: true,
    zones: [
      { id: "p1", name: "persona_1", label: "PERSONA 1", position: { x: 0, y: 0 }, size: { width: 40, height: 30 }, color: "#3498db", allowedTypes: ["persona"], icon: "●" },
      { id: "p2", name: "persona_2", label: "PERSONA 2", position: { x: 40, y: 0 }, size: { width: 40, height: 30 }, color: "#9b59b6", allowedTypes: ["persona"], icon: "●" },
      { id: "p3", name: "persona_3", label: "PERSONA 3", position: { x: 80, y: 0 }, size: { width: 40, height: 30 }, color: "#2ecc71", allowedTypes: ["persona"], icon: "●" },
      { id: "pain", name: "pain_points", label: "PAIN POINTS", position: { x: 0, y: 30 }, size: { width: 60, height: 30 }, color: "#e74c3c", allowedTypes: ["painpoint"], icon: "▲" },
      { id: "goals", name: "goals", label: "GOALS", position: { x: 60, y: 30 }, size: { width: 60, height: 30 }, color: "#f39c12", allowedTypes: ["goal"], icon: "★" },
    ],
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}
