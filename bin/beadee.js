#!/usr/bin/env node

import { startServer } from '../server/index.js'

const VERSION = '0.1.0'

const HELP = `
beadee — web GUI for the beads issue tracker

Usage:
  beadee [options]

Options:
  -p, --port <n>   Port to listen on (default: 0 = OS picks a free port)
  -H, --host <h>   Host to bind to (default: 127.0.0.1)
  -o, --open       Open browser automatically after start
  -v, --version    Print version and exit
  -h, --help       Show this help

Run from a directory with .beads/ to start the GUI.

Examples:
  beadee                  # Start on a random free port
  beadee --port 4000      # Start on port 4000
  beadee --open           # Start and open browser
`.trim()

function parseArgs(argv) {
  const args = argv.slice(2)
  const opts = { port: 0, host: '127.0.0.1', open: false, dev: false }

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '-h' || a === '--help') {
      console.log(HELP)
      process.exit(0)
    }
    if (a === '-v' || a === '--version') {
      console.log(VERSION)
      process.exit(0)
    }
    if ((a === '-p' || a === '--port') && args[i + 1]) {
      opts.port = parseInt(args[++i], 10)
      continue
    }
    if (a.startsWith('--port=')) {
      opts.port = parseInt(a.split('=')[1], 10)
      continue
    }
    if ((a === '-H' || a === '--host') && args[i + 1]) {
      opts.host = args[++i]
      continue
    }
    if (a.startsWith('--host=')) {
      opts.host = a.split('=')[1]
      continue
    }
    if (a === '-o' || a === '--open') {
      opts.open = true
      continue
    }
    if (a === '--dev') {
      opts.dev = true
      continue
    }
    console.error(`Unknown option: ${a}\nRun beadee --help for usage.`)
    process.exit(1)
  }

  return opts
}

const opts = parseArgs(process.argv)

startServer(opts).catch(err => {
  if (err.code === 'BD_NOT_FOUND') {
    console.error('Error: bd not found in PATH. Install beads first.')
  } else if (err.code === 'BD_NO_BEADS_DIR') {
    console.error(`Error: no .beads/ directory found in ${process.cwd()}.`)
    console.error('Run beadee from a directory that contains a beads project.')
  } else {
    console.error('Error:', err.message)
  }
  process.exit(1)
})
