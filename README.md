# bizcanvas

AI-first headless business canvas CLI - mind maps, personas, SWOT analysis, pain points, and more.

Built with [OpenTUI](https://github.com/anomalyco/opentui) + [Turso](https://turso.tech).

## Features

- 🧠 **Mind Maps** - Hierarchical idea organization
- 📊 **SWOT Analysis** - 4-quadrant strategic planning
- 👤 **Personas** - User research and customer profiles
- 🔥 **Pain Points** - Problem identification and tracking
- 🎯 **Opportunities** - Idea capture and prioritization
- 🤖 **AI-First** - Natural language canvas manipulation (coming soon)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Database

Get your Turso credentials:

```bash
turso db show bizcanvas
turso db tokens create bizcanvas
```

Create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your Turso URL and token
```

### 3. Run

```bash
bun start
```

## Keyboard Shortcuts

### Navigation
- `j/↓` - Next node
- `k/↑` - Previous node
- `q` - Quit

### Modes
- `v` - View mode
- `e` - Edit mode
- `c` - Connect mode
- `a` - AI mode

### Quick Add (in canvas)
- `i` - Add Idea 💡
- `p` - Add Pain Point 🔥
- `o` - Add Opportunity 🎯
- `u` - Add Persona 👤
- `g` - Add Goal ⭐
- `t` - Add Task ✅
- `q` - Add Question ❓

### Canvas
- `n` - New canvas
- `l` - List/load canvases
- `d` - Delete selected node

### Debug
- `` ` `` - Toggle console

## Project Structure

```
bizcanvas/
├── src/
│   ├── index.tsx          # Entry point
│   ├── App.tsx            # Main app component
│   ├── db/                # Turso database layer
│   │   ├── client.ts      # Database client
│   │   └── schema.ts      # SQL schema
│   ├── state/             # State management
│   │   ├── types.ts       # TypeScript types
│   │   └── store.ts       # Store with persistence
│   ├── components/        # UI components
│   │   ├── Canvas.tsx     # Main canvas area
│   │   ├── Node.tsx       # Node rendering
│   │   ├── Sidebar.tsx    # Left sidebar
│   │   └── StatusBar.tsx  # Bottom status bar
│   └── primitives/        # Business templates
│       ├── SwotAnalysis.tsx
│       ├── Persona.tsx
│       └── MindMap.tsx
└── .env.example           # Environment template
```

## Database Schema

- **canvases** - Workspaces/boards
- **nodes** - Items on canvas (ideas, pain points, etc.)
- **connections** - Relationships between nodes
- **tags** - Organization labels
- **ai_conversations** - AI interaction history

## Development

```bash
# Watch mode
bun dev

# Type checking
bun typecheck
```

## License

MIT
