# beadee

![beadee](banner.png)

A web GUI for the [beads](https://github.com/mrkrstphr/beads) issue tracker.

## Requirements

- Node.js 18+
- [beads (`bd`)](https://github.com/mrkrstphr/beads) installed and in your `PATH`

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

### Examples

```bash
beadee                  # Start on a random free port
beadee --port 4000      # Start on port 4000
beadee --open           # Start and open browser
```

## Development

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm start        # Run production build
```

## License

MIT

