# ClawDraw Skill

Create and collaborate on AI canvases - SWOT, Business Model Canvas, Lean Canvas, and more.

## Prerequisites

Install ClawDraw globally:
```bash
bun add -g github:epuerta9/clawdraw
```

## Commands

### /canvas create <template> "<name>"
Create a new canvas.

**Templates:** `swot`, `bmc`, `lean`, `empathy`, `journey`, `kanban`, `brainstorm`, `mindmap`, `personas`

### /canvas add <zone> "<content>"
Add content to a zone.

### /canvas view
Display the canvas.

### /canvas list
List all canvases.

### /canvas join <room-id>
Join a real-time collaborative room.

## Instructions

### /canvas create
```bash
clawdraw new <template> "<name>"
```
Save the returned canvas ID for subsequent commands.

### /canvas add
```bash
clawdraw add <canvas-id> <zone> "<content>"
```

### /canvas view
```bash
clawdraw view <canvas-id>
```

### /canvas list
```bash
clawdraw view
```

### /canvas join
```bash
clawdraw join <room-id>
```

## Template Zones

**SWOT:** `strengths`, `weaknesses`, `opportunities`, `threats`

**BMC:** `key_partners`, `key_activities`, `key_resources`, `value_props`, `customer_rel`, `channels`, `customer_seg`, `cost_structure`, `revenue_streams`

**Lean:** `problem`, `solution`, `unique_value`, `unfair_advantage`, `customer_segments`, `key_metrics`, `channels`, `cost_structure`, `revenue_streams`

**Kanban:** `backlog`, `todo`, `in_progress`, `done`

**Empathy:** `thinks_feels`, `sees`, `persona`, `hears`, `says_does`

## Example Session

```
User: Create a SWOT analysis for our Q1 strategy
→ clawdraw new swot "Q1 Strategy"
→ Canvas created: abc123

User: Add to strengths: Strong engineering team
→ clawdraw add abc123 strengths "Strong engineering team"

User: Add weakness: Limited budget
→ clawdraw add abc123 weaknesses "Limited budget"

User: Show me the canvas
→ clawdraw view abc123
```

## Collaboration

For real-time collaboration with multiple users:

```bash
# Login first
clawdraw login

# Create online room
clawdraw create "Team Strategy" swot

# Share room ID with others
clawdraw join <room-id>
```
