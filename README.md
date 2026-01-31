# bizcanvas

Business canvas skill for Claude Code - organize ideas, personas, SWOT analyses, and mind maps with persistent storage and cross-session linking.

## What it does

- **Capture ideas** conversationally through Claude Code
- **Build personas** with goals, pain points, demographics
- **SWOT analysis** with 4-quadrant visualization
- **Link ideas** with labeled relationships
- **Tag and organize** across projects
- **Persist** everything in Turso (SQLite) across sessions

## Setup

1. Install dependencies:
```bash
cd bizcanvas
bun install
```

2. Configure Turso (already done if you followed setup):
```bash
cp .env.example .env
# Add your TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
```

## Usage

### In Claude Code (primary way)

```
/bizcanvas
```

Then just talk - "I want to create a persona for PlateIQ", "Let's do a SWOT analysis", "Link this to the coach persona", etc.

### CLI (for viewing)

```bash
# List all notes
bun run cli list

# List by type
bun run cli list persona

# Show a note
bun run cli show <id-prefix>

# Show connections
bun run cli links <id-prefix>

# Search
bun run cli search "keyword"

# Show SWOT
bun run cli swot <collection-id>

# Export all data
bun run cli export
```

## Data Model

**Notes** - The core unit. Types:
- `note` 📝 - General notes
- `idea` 💡 - Ideas and concepts
- `persona` 👤 - User personas
- `painpoint` 🔥 - Pain points
- `goal` 🎯 - Goals
- `question` ❓ - Questions
- `swot_s/w/o/t` - SWOT quadrants

**Links** - Bidirectional relationships between notes with optional labels

**Collections** - Groups of notes (canvas, mindmap, swot, persona_set, project)

**Tags** - Cross-cutting organization

## Storage

Data stored in Turso at `libsql://bizcanvas-epuerta.aws-us-east-2.turso.io`
