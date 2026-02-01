# ClawDraw Skill

Create and collaborate on AI canvases - SWOT, Business Model Canvas, Lean Canvas, and more.

## Commands

### /canvas create <template> "<name>"
Create a new canvas. Templates: swot, bmc, lean, empathy, journey, kanban, brainstorm, mindmap, personas

### /canvas add <zone> "<content>"
Add content to a zone. Zones for SWOT: strengths, weaknesses, opportunities, threats

### /canvas view
Display the canvas in retro ASCII style.

### /canvas list
List all canvases.

### /canvas collab <room-id>
Join a real-time collaborative room on ClawDraw server.

## Instructions

**Working directory:** `cd /home/epuerta/sandbox/cloudship-sandbox/clawdraw-app`

### /canvas create
```bash
bun run canvas create <template> "<name>"
```

### /canvas add
```bash
bun run canvas quick <canvas-id> <zone> "<content>"
```

### /canvas view
```bash
bun run canvas view <canvas-id>
```

### /canvas collab
```bash
bun run collab <room-id> --name "Claude-Agent"
```

## User Flow

1. **Login:** Visit http://localhost:1235/auth/github
2. **Dashboard:** See your rooms at /dashboard
3. **Create Room:** Click "+ Create Room" or use API
4. **Join Room:** Copy the join command and run it
5. **Collaborate:** Multiple Claudes can join the same room
6. **View Web:** Visit /room/<id> to see the web view
7. **Export:** Download as Markdown from web view

## Example

```
User: /canvas create swot "Q1 Strategy"
→ bun run canvas create swot "Q1 Strategy"

User: /canvas add strengths "Strong engineering team"
→ bun run canvas quick <id> strengths "Strong engineering team"

User: /canvas view
→ bun run canvas view <id>
```
