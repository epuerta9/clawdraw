# ClawDraw

<div align="center">

**Terminal whiteboard for AI collaboration**

Create SWOT analyses, Business Model Canvases, Lean Canvases, and more — directly from your terminal.

[![GitHub](https://img.shields.io/badge/GitHub-epuerta9%2Fclawdraw-blue?logo=github)](https://github.com/epuerta9/clawdraw)
[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)

</div>

---

## Install

```bash
# Requires Bun: curl -fsSL https://bun.sh/install | bash

bun add -g github:epuerta9/clawdraw
```

Verify installation:
```bash
clawdraw help
```

---

## Quick Start

### Create a SWOT Analysis

```bash
# Create canvas
clawdraw new swot "Q1 Product Strategy"
# → Created canvas: abc123

# Add items to zones
clawdraw add abc123 strengths "Strong engineering team"
clawdraw add abc123 strengths "Established brand recognition"
clawdraw add abc123 weaknesses "Limited marketing budget"
clawdraw add abc123 opportunities "Emerging AI market"
clawdraw add abc123 threats "New competitor entering space"

# View the canvas
clawdraw view abc123
```

### Open Interactive Board

```bash
clawdraw board
```

---

## Commands

### Local Mode (No Account Required)

| Command | Description |
|---------|-------------|
| `clawdraw new <template> <name>` | Create a new canvas |
| `clawdraw add <id> <zone> <text>` | Add item to a zone |
| `clawdraw view [id]` | View canvas (or list all) |
| `clawdraw board` | Open interactive terminal board |

### Online Mode (Real-time Collaboration)

| Command | Description |
|---------|-------------|
| `clawdraw login` | Authenticate via GitHub |
| `clawdraw logout` | Clear credentials |
| `clawdraw status` | Show connection status |
| `clawdraw create <name> [template]` | Create online room |
| `clawdraw rooms` | List your rooms |
| `clawdraw join <room-id>` | Join collaborative room |

---

## Templates

| Template | Description | Zones |
|----------|-------------|-------|
| `swot` | SWOT Analysis | strengths, weaknesses, opportunities, threats |
| `bmc` | Business Model Canvas | key_partners, key_activities, key_resources, value_props, customer_rel, channels, customer_seg, cost_structure, revenue_streams |
| `lean` | Lean Canvas | problem, solution, unique_value, unfair_advantage, customer_segments, key_metrics, channels, cost_structure, revenue_streams |
| `kanban` | Kanban Board | backlog, todo, in_progress, done |
| `empathy` | Empathy Map | thinks_feels, sees, persona, hears, says_does |
| `journey` | User Journey Map | awareness, consideration, decision, purchase, retention |
| `brainstorm` | Freeform Canvas | (no zones - free placement) |
| `mindmap` | Mind Map | center |
| `personas` | Persona Gallery | persona_1, persona_2, persona_3, pain_points, goals |

---

## Claude Code Integration

Add ClawDraw as a skill for Claude Code to enable AI-assisted canvas creation.

### Install the Skill

```bash
# Create skills directory if needed
mkdir -p ~/.claude/skills

# Download the skill
curl -fsSL https://raw.githubusercontent.com/epuerta9/clawdraw/main/.claude/skills/canvas.md \
  -o ~/.claude/skills/clawdraw.md
```

### Use with Claude

Once installed, ask Claude:

> "Create a SWOT analysis for our product launch"

> "Add strengths: experienced team, strong brand"

> "Show me the canvas"

Claude will use ClawDraw commands to build and display your canvas.

---

## Custom Templates

Create your own templates by defining zones in TypeScript:

```typescript
// ~/.clawdraw/templates/my-template.ts
import type { Template } from "clawdraw/canvas/types"

export const myTemplate: Template = {
  id: "my-template",
  name: "My Custom Template",
  description: "A custom canvas layout",
  icon: "◈",
  defaultSize: { width: 100, height: 40 },
  autoPlace: true,
  zones: [
    {
      id: "zone1",
      name: "first_zone",
      label: "FIRST ZONE",
      position: { x: 0, y: 0 },
      size: { width: 50, height: 20 },
      color: "#00ff41",
      icon: "▲"
    },
    {
      id: "zone2",
      name: "second_zone",
      label: "SECOND ZONE",
      position: { x: 50, y: 0 },
      size: { width: 50, height: 20 },
      color: "#ff6b6b",
      icon: "▼"
    },
  ],
}
```

### Zone Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Zone name for CLI commands |
| `label` | string | Display label |
| `position` | `{x, y}` | Position in canvas units |
| `size` | `{width, height}` | Size in canvas units |
| `color` | string | Hex color for borders/text |
| `icon` | string | Optional icon character |
| `allowedTypes` | string[] | Optional: restrict note types |

---

## Keyboard Shortcuts

In interactive board mode (`clawdraw board`):

| Key | Action |
|-----|--------|
| `↑/k` | Move up |
| `↓/j` | Move down |
| `←/h` | Move left |
| `→/l` | Move right |
| `r` | Refresh |
| `q` | Quit |

---

## Configuration

ClawDraw stores config in `~/.clawdraw/`:

```
~/.clawdraw/
├── config.json    # Server URL, auth token
├── canvases.db    # Local SQLite database
└── templates/     # Custom templates
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAWDRAW_SERVER` | `https://clawdraw.cloudshipai.com` | Server URL |

---

## Development

```bash
# Clone
git clone https://github.com/epuerta9/clawdraw.git
cd clawdraw

# Install
bun install

# Run
bun run clawdraw help

# Run interactive board
bun run canvas:live
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    clawdraw CLI                         │
├─────────────────────────────────────────────────────────┤
│  Local Mode           │  Online Mode                    │
│  ─────────────        │  ───────────                    │
│  SQLite storage       │  Y.js + WebSocket               │
│  Offline-first        │  Real-time sync                 │
│  Single user          │  Multi-user collaboration       │
└───────────────────────┴─────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  ClawDraw Server    │
                    │  (clawdraw-server)  │
                    │                     │
                    │  • Hono + Bun       │
                    │  • Y.js/Hocuspocus  │
                    │  • Turso database   │
                    │  • GitHub OAuth     │
                    └─────────────────────┘
```

---

## License

MIT

---

<div align="center">

**[ClawDraw Server](https://github.com/epuerta9/clawdraw-server)** · **[CloudShip AI](https://cloudshipai.com)**

</div>
