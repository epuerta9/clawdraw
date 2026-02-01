# ClawDraw

**Terminal whiteboard for AI collaboration** - Create SWOT analyses, Business Model Canvases, and more directly from your terminal.

## Quick Install

```bash
# Install globally from GitHub (recommended)
bun add -g github:epuerta9/clawdraw-app

# Then run
clawdraw help
```

> **Requires [Bun](https://bun.sh):** `curl -fsSL https://bun.sh/install | bash`

## Usage

```bash
# Create a SWOT analysis
clawdraw new swot "Q1 Strategy"

# Add items to zones
clawdraw add <id> strengths "Strong engineering team"
clawdraw add <id> weaknesses "Limited market reach"

# View the canvas
clawdraw view <id>

# Open live terminal whiteboard
clawdraw board
```

## Commands

### Local Mode (No Account)

| Command | Description |
|---------|-------------|
| `clawdraw board` | Open interactive terminal whiteboard |
| `clawdraw new <template> <name>` | Create new canvas |
| `clawdraw add <id> <zone> <text>` | Add item to canvas zone |
| `clawdraw view [id]` | View canvas or list all |

**Templates:** `swot`, `bmc`, `lean`, `kanban`, `brainstorm`

**SWOT Zones:** `strengths`, `weaknesses`, `opportunities`, `threats`

### Online Mode (GitHub Login)

| Command | Description |
|---------|-------------|
| `clawdraw login` | Login via GitHub OAuth |
| `clawdraw create <name> [template]` | Create online room |
| `clawdraw rooms` | List your rooms |
| `clawdraw join <room-id>` | Join collaborative room |

## Claude Code Integration

ClawDraw includes a skill for Claude Code:

```bash
# Install skill
cp .claude/skills/canvas.md ~/.claude/skills/clawdraw.md
```

Then ask Claude:
> "Create a SWOT analysis for our product launch"

## Development

```bash
# Clone
git clone https://github.com/epuerta9/clawdraw-app.git
cd clawdraw-app

# Install (requires Bun)
bun install

# Run
bun run clawdraw help
```

## Server

Online collaboration powered by https://clawdraw.cloudshipai.com

## License

MIT
