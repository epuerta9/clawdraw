# ClawDraw CLI

<div align="center">

**AI canvas collaboration tool**

Create Mermaid diagrams, SWOT analyses, and strategic canvases via CLI — view results at [clawdraw.cloudshipai.com](https://clawdraw.cloudshipai.com)

[![GitHub](https://img.shields.io/badge/GitHub-epuerta9%2Fclawdraw-blue?logo=github)](https://github.com/epuerta9/clawdraw)
[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)

</div>

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│              clawdraw.cloudshipai.com                   │
│         (View rooms, rendered diagrams)                 │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ WebSocket
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ Claude  │     │ Claude  │     │ Human   │
    │ CLI     │     │ CLI     │     │ Browser │
    └─────────┘     └─────────┘     └─────────┘
```

- **CLI** - Claudes create rooms and add content
- **Web** - Humans view rendered diagrams and canvases

---

## Install

```bash
# Requires Bun: curl -fsSL https://bun.sh/install | bash

cd clawdraw-app
bun install
bun link
```

Verify:
```bash
clawdraw help
```

---

## Quick Start

### 1. Login with GitHub

```bash
clawdraw login
```

### 2. Create a Mermaid Canvas

```bash
clawdraw canvas create --name "System Architecture"
# → Created room: mermaid-abc123
```

### 3. Add Diagrams

```bash
# Pipe Mermaid syntax
echo 'flowchart LR
    A[User] --> B[API]
    B --> C[Database]' | clawdraw canvas add mermaid-abc123
```

### 4. View in Browser

Open **https://clawdraw.cloudshipai.com/room/mermaid-abc123**

### 5. Export to Markdown

```bash
clawdraw canvas export mermaid-abc123 > ARCHITECTURE.md
```

---

## Commands

### Account

| Command | Description |
|---------|-------------|
| `clawdraw login` | Authenticate via GitHub |
| `clawdraw logout` | Sign out |
| `clawdraw whoami` | Show current user |

### Mermaid Canvas

| Command | Description |
|---------|-------------|
| `clawdraw canvas create --name "<name>"` | Create diagram canvas |
| `echo '<mermaid>' \| clawdraw canvas add <id>` | Add diagram via stdin |
| `clawdraw canvas add <id> --file <path>` | Add diagram from file |
| `clawdraw canvas list <id>` | List diagrams |
| `clawdraw canvas export <id>` | Export to Markdown |
| `clawdraw canvas remove <id> --id <diagram-id>` | Remove a diagram |

### Template Rooms

| Command | Description |
|---------|-------------|
| `clawdraw create <name> [template]` | Create room with template |
| `clawdraw push <room-id>` | Push content to room |
| `clawdraw rooms` | List your rooms |

---

## Mermaid Canvas Workflow

Multiple Claudes collaborate on diagrams, then export to git for alignment:

```bash
# Claude A: Create canvas
clawdraw canvas create --name "Architecture Decision"
# → Room ID: mermaid-abc123

# Claude A: Add API diagram
echo 'flowchart TD
    A[Request] --> B{Auth?}
    B -->|Yes| C[Process]
    B -->|No| D[Reject]' | clawdraw canvas add mermaid-abc123

# Claude B: Add sequence diagram
echo 'sequenceDiagram
    Client->>API: Request
    API->>DB: Query
    DB-->>API: Result' | clawdraw canvas add mermaid-abc123

# Human: View at https://clawdraw.cloudshipai.com/room/mermaid-abc123

# Lead Claude: Export and commit
clawdraw canvas export mermaid-abc123 > docs/architecture.md
git add docs/architecture.md && git commit -m "Add architecture diagrams"

# All Claudes read from git - aligned!
```

### Supported Diagram Types

| Type | Syntax Start |
|------|--------------|
| Flowchart | `flowchart LR` or `flowchart TD` |
| Sequence | `sequenceDiagram` |
| State | `stateDiagram-v2` |
| Class | `classDiagram` |
| ER | `erDiagram` |
| Mindmap | `mindmap` |
| Timeline | `timeline` |

> **Tip:** Use `flowchart` instead of `graph` for best compatibility.

---

## Templates

| Template | Description |
|----------|-------------|
| `swot` | SWOT Analysis (strengths, weaknesses, opportunities, threats) |
| `bmc` | Business Model Canvas |
| `lean` | Lean Canvas |
| `kanban` | Kanban Board (backlog, todo, in_progress, done) |
| `empathy` | Empathy Map |
| `journey` | User Journey Map |
| `brainstorm` | Freeform Canvas |

### Example: SWOT Analysis

```bash
# Create SWOT room
clawdraw create "Q1 Strategy" swot
# → Room ID: abc123

# View at https://clawdraw.cloudshipai.com/room/abc123
```

---

## Claude Code Integration

Add ClawDraw as a skill for Claude Code:

```bash
mkdir -p ~/.claude/skills
curl -fsSL https://raw.githubusercontent.com/epuerta9/clawdraw/main/.claude/skills/canvas.md \
  -o ~/.claude/skills/clawdraw.md
```

Then ask Claude:

> "Create a Mermaid canvas for our API architecture"

> "Add a flowchart showing the auth flow"

> "Export the diagrams to docs/"

---

## Environment

| Variable | Description |
|----------|-------------|
| `CLAWDRAW_SERVER` | Server URL (default: `https://clawdraw.cloudshipai.com`) |

---

## Web Features

Visit [clawdraw.cloudshipai.com](https://clawdraw.cloudshipai.com) to:

- View rendered Mermaid diagrams
- See real-time updates as Claudes add content
- Export canvases to Markdown
- Manage your rooms

---

## License

MIT
