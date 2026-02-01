# ClawDraw Skill

Create and collaborate on AI canvases - SWOT, Business Model Canvas, Lean Canvas, and more.

## Prerequisites

Install ClawDraw globally:
```bash
bun add -g github:epuerta9/clawdraw
```

## Commands

### Create a room
```bash
clawdraw create "<name>" [template]
```
Templates: `swot`, `bmc`, `lean`, `kanban`, `empathy`, `journey`, `brainstorm`

### Push items to room (syncs to all viewers)
```bash
clawdraw push <room-id> <zone> "<content>"
```

### List rooms
```bash
clawdraw rooms
```

## Template Zones

**SWOT:** `strengths`, `weaknesses`, `opportunities`, `threats`

**BMC:** `key_partners`, `key_activities`, `key_resources`, `value_props`, `customer_rel`, `channels`, `customer_seg`, `cost_structure`, `revenue_streams`

**Lean:** `problem`, `solution`, `unique_value`, `unfair_advantage`, `customer_segments`, `key_metrics`, `channels`, `cost_structure`, `revenue_streams`

**Kanban:** `backlog`, `todo`, `in_progress`, `done`

## Example: SWOT Analysis

```bash
# Create a room
clawdraw create "Q1 Product Strategy" swot
# Returns room ID, e.g., abc123

# User opens whiteboard in another terminal:
# clawdraw join abc123

# Push items (auto-syncs to whiteboard viewer)
clawdraw push abc123 strengths "Experienced engineering team"
clawdraw push abc123 strengths "Strong brand recognition"
clawdraw push abc123 weaknesses "Limited marketing budget"
clawdraw push abc123 weaknesses "Small sales team"
clawdraw push abc123 opportunities "Emerging AI market"
clawdraw push abc123 opportunities "International expansion"
clawdraw push abc123 threats "New competitor funding"
clawdraw push abc123 threats "Economic uncertainty"
```

## Example: Business Model Canvas

```bash
clawdraw create "Startup BMC" bmc
# Returns room ID

clawdraw push <id> value_props "AI-powered automation"
clawdraw push <id> customer_seg "Enterprise SaaS companies"
clawdraw push <id> channels "Direct sales, partnerships"
clawdraw push <id> revenue_streams "Subscription, usage-based"
clawdraw push <id> key_activities "Product development, support"
clawdraw push <id> key_resources "Engineering team, cloud infra"
clawdraw push <id> key_partners "Cloud providers, integrations"
clawdraw push <id> cost_structure "Engineering, infrastructure, sales"
```

## Workflow

1. **Create room** → Get room ID
2. **User opens viewer** → `clawdraw join <room-id>` (in separate terminal)
3. **Claude pushes items** → Changes appear instantly on viewer
4. **Real-time collaboration** → Multiple viewers see same updates
