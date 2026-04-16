import { createServer as createHttpServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequestListener } from '@react-router/node'
import openUrl from 'open'
import { bdCheck } from './bd.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const buildDir  = join(__dirname, '..', 'build')
const clientDir = join(buildDir, 'client')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
}

async function tryServeStatic(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost')
    const filePath = join(clientDir, url.pathname)
    // Don't escape clientDir
    if (!filePath.startsWith(clientDir + '/') && filePath !== clientDir) return false

    const s = await stat(filePath)
    if (!s.isFile()) return false

    const ext = extname(filePath)
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    // Fingerprinted assets can be cached indefinitely
    if (url.pathname.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
    createReadStream(filePath).pipe(res)
    return true
  } catch {
    return false
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createNetServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

export async function startServer({ port = 0, host = '127.0.0.1', open = false } = {}) {
  const cwd = process.cwd()

  // Verify bd is available before starting
  await bdCheck(cwd)

  const build = await import(join(buildDir, 'server/index.js'))
  const handler = createRequestListener({ build, mode: 'production' })

  const server = createHttpServer(async (req, res) => {
    // Serve fingerprinted assets directly — RR7 handler doesn't know about them
    if (req.url?.startsWith('/assets/') || req.url === '/favicon.ico') {
      if (await tryServeStatic(req, res)) return
    }
    await handler(req, res)
  })

  const listenPort = port === 0 ? await getFreePort() : port
  await new Promise((resolve, reject) => {
    server.listen(listenPort, host, resolve)
    server.once('error', reject)
  })

  const url = `http://${host}:${listenPort}`

  console.log('')
  console.log('  beadee')
  console.log(`  project : ${cwd.split('/').pop()}`)
  console.log(`  url     : ${url}`)
  console.log('')

  if (open) await openUrl(url)

  return { server, url, port: listenPort }
}
