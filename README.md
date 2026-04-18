# beadee

![beadee](banner.png)

A web GUI for the [beads](https://github.com/gastownhall/beads) issue tracker.

## Features

- **List & Board views** — switch between a filterable list with a detail pane and a Kanban board
- **Full CRUD** — create, edit, claim, and close issues without leaving the browser
- **Rich filtering** — filter by status, type, priority, or full-text search
- **Issue detail pane** — inline view of description, labels, children, and comments
- **Real-time updates** — changes made via `bd` CLI reflect instantly via SSE
- **Themes** — dark (default), light, dracula, synthwave, hacker, and auto

![beadee screenshot](screenshot.png)

## Requirements

- Node.js 18+
- `bd`installed and in your `PATH`

## Installation

```bash
npm install -g @mrkrstphr/beadee
```

## Usage

Run from a directory that contains a beads project (`.beads/`):

```bash
beadee
```

Or:

```bash
npx @mrkrstphr/beadee --open
```

### Options

```
-p, --port <n>   Port to listen on (default: OS picks a free port)
-H, --host <h>   Host to bind to (default: 127.0.0.1)
-o, --open       Open browser automatically after start
-v, --version    Print version and exit
-h, --help       Show this help
```

## License

MIT
